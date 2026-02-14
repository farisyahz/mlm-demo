import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  stokisProcedure,
  memberProcedure,
} from "~/server/api/trpc";
import {
  stokis,
  pins,
  memberProfiles,
  pvPurchases,
  wallets,
  transactions,
  notifications,
} from "~/server/db/schema";
import { addToNationalTurnover } from "~/server/services/wallet";
import { propagatePVUp } from "~/server/services/binary-tree";
import { calculatePersonalBonus } from "~/server/services/bonuses/personal-bonus";

export const stokisRouter = createTRPCRouter({
  /** Get stokis profile */
  getMyProfile: stokisProcedure.query(async ({ ctx }) => {
    return ctx.db.query.stokis.findFirst({
      where: eq(stokis.memberId, ctx.memberProfile.id),
    });
  }),

  /** Get stokis PIN stock */
  getPinStock: stokisProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        status: z.enum(["available", "used", "expired"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const stokisProfile = await ctx.db.query.stokis.findFirst({
        where: eq(stokis.memberId, ctx.memberProfile.id),
      });

      if (!stokisProfile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Stokis profile not found" });
      }

      const conditions = [eq(pins.stokisId, stokisProfile.id)];
      if (input.status) conditions.push(eq(pins.status, input.status));

      const items = await ctx.db.query.pins.findMany({
        where: and(...conditions),
        limit: input.limit,
        offset: input.offset,
        orderBy: desc(pins.createdAt),
      });

      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(pins)
        .where(and(...conditions));

      return { pins: items, total: Number(countResult[0]?.count ?? 0) };
    }),

  /** Sell a PIN to a member (used during registration) */
  sellPin: stokisProcedure
    .input(z.object({ pinId: z.number(), buyerMemberId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const pin = await ctx.db.query.pins.findFirst({
        where: and(eq(pins.id, input.pinId), eq(pins.status, "available")),
      });

      if (!pin) {
        throw new TRPCError({ code: "NOT_FOUND", message: "PIN not available" });
      }

      const [updated] = await ctx.db
        .update(pins)
        .set({
          status: "used",
          usedByMemberId: input.buyerMemberId,
          usedAt: new Date(),
        })
        .where(eq(pins.id, input.pinId))
        .returning();

      return updated;
    }),

  /** List all stokis (for member purchase flow) */
  listStokis: memberProcedure.query(async ({ ctx }) => {
    return ctx.db.query.stokis.findMany({
      where: eq(stokis.isActive, true),
      with: { member: { with: { user: true } } },
    });
  }),

  /** Member: request to buy PV from a stokis */
  requestPVPurchase: memberProcedure
    .input(
      z.object({
        stokisId: z.number(),
        pvAmount: z.number().positive(),
        paymentMethod: z.enum(["wallet", "manual_transfer"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const stokisProfile = await ctx.db.query.stokis.findFirst({
        where: and(eq(stokis.id, input.stokisId), eq(stokis.isActive, true)),
      });

      if (!stokisProfile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Stokis tidak ditemukan" });
      }

      if (Number(stokisProfile.pvStock) < input.pvAmount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Stok PV stokis tidak mencukupi. Tersedia: ${stokisProfile.pvStock} PV`,
        });
      }

      const rupiahAmount = input.pvAmount * 1000; // 1 PV = Rp1.000

      // If wallet payment, check and debit balance immediately
      if (input.paymentMethod === "wallet") {
        const wallet = await ctx.db.query.wallets.findFirst({
          where: eq(wallets.memberId, ctx.memberProfile.id),
        });

        if (!wallet || Number(wallet.mainBalance) < rupiahAmount) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Saldo tidak mencukupi. Dibutuhkan: Rp${rupiahAmount.toLocaleString("id-ID")}`,
          });
        }

        // Debit wallet
        await ctx.db
          .update(wallets)
          .set({
            mainBalance: sql`${wallets.mainBalance} - ${rupiahAmount}`,
          })
          .where(eq(wallets.memberId, ctx.memberProfile.id));

        // Record transaction
        await ctx.db.insert(transactions).values({
          memberId: ctx.memberProfile.id,
          type: "pv_stock",
          amount: String(-rupiahAmount),
          pvAmount: String(input.pvAmount),
          description: `Pembelian ${input.pvAmount} PV dari Stokis #${stokisProfile.stokisNumber}`,
          status: "completed",
        });

        // Create confirmed purchase
        const [purchase] = await ctx.db
          .insert(pvPurchases)
          .values({
            memberId: ctx.memberProfile.id,
            stokisId: input.stokisId,
            pvAmount: String(input.pvAmount),
            rupiahAmount: String(rupiahAmount),
            status: "confirmed",
            paymentMethod: "wallet",
            confirmedAt: new Date(),
          })
          .returning();

        // Process the PV credit
        await processPVCredit(ctx.db, ctx.memberProfile.id, input.pvAmount, stokisProfile);

        return purchase;
      }

      // Manual transfer: create pending purchase
      const [purchase] = await ctx.db
        .insert(pvPurchases)
        .values({
          memberId: ctx.memberProfile.id,
          stokisId: input.stokisId,
          pvAmount: String(input.pvAmount),
          rupiahAmount: String(rupiahAmount),
          status: "pending",
          paymentMethod: "manual_transfer",
        })
        .returning();

      // Notify stokis
      await ctx.db.insert(notifications).values({
        memberId: stokisProfile.memberId,
        title: "Permintaan Pembelian PV",
        message: `Member baru meminta pembelian ${input.pvAmount} PV (Rp${rupiahAmount.toLocaleString("id-ID")}) via transfer manual.`,
        type: "system",
      });

      return purchase;
    }),

  /** Stokis: list PV purchase requests */
  listPVRequests: stokisProcedure
    .input(
      z.object({
        status: z.enum(["pending", "confirmed", "rejected"]).optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const stokisProfile = await ctx.db.query.stokis.findFirst({
        where: eq(stokis.memberId, ctx.memberProfile.id),
      });

      if (!stokisProfile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Profil stokis tidak ditemukan" });
      }

      const conditions = [eq(pvPurchases.stokisId, stokisProfile.id)];
      if (input.status) conditions.push(eq(pvPurchases.status, input.status));

      return ctx.db.query.pvPurchases.findMany({
        where: and(...conditions),
        with: { member: { with: { user: true } } },
        limit: input.limit,
        orderBy: desc(pvPurchases.createdAt),
      });
    }),

  /** Stokis: confirm a pending PV purchase */
  confirmPVPurchase: stokisProcedure
    .input(z.object({ purchaseId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const stokisProfile = await ctx.db.query.stokis.findFirst({
        where: eq(stokis.memberId, ctx.memberProfile.id),
      });

      if (!stokisProfile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Profil stokis tidak ditemukan" });
      }

      const purchase = await ctx.db.query.pvPurchases.findFirst({
        where: and(
          eq(pvPurchases.id, input.purchaseId),
          eq(pvPurchases.stokisId, stokisProfile.id),
          eq(pvPurchases.status, "pending"),
        ),
      });

      if (!purchase) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Permintaan tidak ditemukan" });
      }

      const pvAmount = Number(purchase.pvAmount);

      if (Number(stokisProfile.pvStock) < pvAmount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Stok PV tidak mencukupi",
        });
      }

      // Update purchase status
      const [updated] = await ctx.db
        .update(pvPurchases)
        .set({ status: "confirmed", confirmedAt: new Date() })
        .where(eq(pvPurchases.id, input.purchaseId))
        .returning();

      // Process the PV credit
      await processPVCredit(ctx.db, purchase.memberId, pvAmount, stokisProfile);

      // Calculate stokis commission
      const commissionRate = Number(stokisProfile.commissionRate);
      const rupiahAmount = Number(purchase.rupiahAmount);
      const commission = (rupiahAmount * commissionRate) / 100;

      if (commission > 0) {
        // Credit commission to stokis wallet
        await ctx.db
          .update(wallets)
          .set({
            mainBalance: sql`${wallets.mainBalance} + ${commission}`,
          })
          .where(eq(wallets.memberId, stokisProfile.memberId));

        // Update total commission
        await ctx.db
          .update(stokis)
          .set({
            totalCommission: sql`${stokis.totalCommission} + ${commission}`,
          })
          .where(eq(stokis.id, stokisProfile.id));

        // Record commission transaction
        await ctx.db.insert(transactions).values({
          memberId: stokisProfile.memberId,
          type: "bonus_credit",
          amount: String(commission),
          description: `Komisi penjualan PV: ${commissionRate}% dari Rp${rupiahAmount.toLocaleString("id-ID")}`,
          status: "completed",
        });
      }

      // Notify member
      await ctx.db.insert(notifications).values({
        memberId: purchase.memberId,
        title: "Pembelian PV Dikonfirmasi",
        message: `Pembelian ${pvAmount} PV Anda telah dikonfirmasi oleh stokis.`,
        type: "system",
      });

      return updated;
    }),

  /** Stokis: reject a pending PV purchase */
  rejectPVPurchase: stokisProcedure
    .input(
      z.object({
        purchaseId: z.number(),
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const stokisProfile = await ctx.db.query.stokis.findFirst({
        where: eq(stokis.memberId, ctx.memberProfile.id),
      });

      if (!stokisProfile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Profil stokis tidak ditemukan" });
      }

      const purchase = await ctx.db.query.pvPurchases.findFirst({
        where: and(
          eq(pvPurchases.id, input.purchaseId),
          eq(pvPurchases.stokisId, stokisProfile.id),
          eq(pvPurchases.status, "pending"),
        ),
      });

      if (!purchase) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Permintaan tidak ditemukan" });
      }

      const [updated] = await ctx.db
        .update(pvPurchases)
        .set({
          status: "rejected",
          rejectedAt: new Date(),
          rejectionReason: input.reason ?? "Ditolak oleh stokis",
        })
        .where(eq(pvPurchases.id, input.purchaseId))
        .returning();

      // Notify member
      await ctx.db.insert(notifications).values({
        memberId: purchase.memberId,
        title: "Pembelian PV Ditolak",
        message: `Permintaan pembelian ${Number(purchase.pvAmount)} PV Anda ditolak. ${input.reason ? `Alasan: ${input.reason}` : ""}`,
        type: "system",
      });

      return updated;
    }),

  /** Stokis: get commission stats and history */
  getCommissionStats: stokisProcedure.query(async ({ ctx }) => {
    const stokisProfile = await ctx.db.query.stokis.findFirst({
      where: eq(stokis.memberId, ctx.memberProfile.id),
    });

    if (!stokisProfile) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Profil stokis tidak ditemukan" });
    }

    // Get commission transactions
    const commissionTxns = await ctx.db.query.transactions.findMany({
      where: and(
        eq(transactions.memberId, ctx.memberProfile.id),
        eq(transactions.type, "bonus_credit"),
      ),
      orderBy: desc(transactions.createdAt),
      limit: 50,
    });

    // Get confirmed PV purchases
    const confirmedPurchases = await ctx.db.query.pvPurchases.findMany({
      where: and(
        eq(pvPurchases.stokisId, stokisProfile.id),
        eq(pvPurchases.status, "confirmed"),
      ),
      orderBy: desc(pvPurchases.confirmedAt),
      limit: 50,
      with: { member: { with: { user: true } } },
    });

    // Count total PV sold
    const pvSoldResult = await ctx.db
      .select({ total: sql<string>`COALESCE(SUM(${pvPurchases.pvAmount}), 0)` })
      .from(pvPurchases)
      .where(and(
        eq(pvPurchases.stokisId, stokisProfile.id),
        eq(pvPurchases.status, "confirmed"),
      ));

    // Count total PINs used (sold by this stokis)
    const pinsUsedResult = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(pins)
      .where(and(
        eq(pins.stokisId, stokisProfile.id),
        eq(pins.status, "used"),
      ));

    return {
      totalCommission: stokisProfile.totalCommission,
      commissionRate: stokisProfile.commissionRate,
      totalPVSold: Number(pvSoldResult[0]?.total ?? 0),
      totalPINsUsed: Number(pinsUsedResult[0]?.count ?? 0),
      commissionHistory: commissionTxns,
      pvSalesHistory: confirmedPurchases,
    };
  }),
});

/**
 * Helper: Process PV credit after confirmed purchase.
 * - Reduce stokis PV stock
 * - Add PV to member
 * - Add to national turnover
 * - Propagate PV up binary tree
 * - Calculate personal bonus
 */
async function processPVCredit(
  db: any,
  memberId: number,
  pvAmount: number,
  stokisProfile: any,
): Promise<void> {
  // 1. Reduce stokis PV stock
  await db
    .update(stokis)
    .set({
      pvStock: sql`${stokis.pvStock} - ${pvAmount}`,
    })
    .where(eq(stokis.id, stokisProfile.id));

  // 2. Add PV to member
  await db
    .update(memberProfiles)
    .set({
      personalPV: sql`${memberProfiles.personalPV} + ${pvAmount}`,
      accumulatedPV: sql`${memberProfiles.accumulatedPV} + ${pvAmount}`,
      weeklyRepurchasePV: sql`${memberProfiles.weeklyRepurchasePV} + ${pvAmount}`,
      lastRepurchaseAt: new Date(),
    })
    .where(eq(memberProfiles.id, memberId));

  // 3. Add to national turnover
  await addToNationalTurnover(pvAmount);

  // 4. Propagate PV up binary tree
  await propagatePVUp(memberId, pvAmount);

  // 5. Calculate personal shopping bonus (15%)
  await calculatePersonalBonus(memberId, pvAmount);
}
