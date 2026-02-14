import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  adminProcedure,
} from "~/server/api/trpc";
import {
  memberProfiles,
  pins,
  stokis,
  wallets,
  nationalTurnover,
  companySettings,
  rewards,
  auditLog,
  user,
  products,
  notifications,
} from "~/server/db/schema";
import { nanoid } from "~/lib/nanoid";

export const adminRouter = createTRPCRouter({
  /** Dashboard overview */
  getDashboard: adminProcedure.query(async ({ ctx }) => {
    const memberCount = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(memberProfiles);

    const activeMemberCount = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(memberProfiles)
      .where(eq(memberProfiles.isActive, true));

    const totalWalletBalance = await ctx.db
      .select({
        total: sql<string>`COALESCE(SUM(${wallets.mainBalance}), 0)`,
      })
      .from(wallets);

    const unsettledTurnover = await ctx.db
      .select({
        totalPV: sql<string>`COALESCE(SUM(${nationalTurnover.totalPV}), 0)`,
        totalRupiah: sql<string>`COALESCE(SUM(${nationalTurnover.totalRupiah}), 0)`,
      })
      .from(nationalTurnover)
      .where(eq(nationalTurnover.isSettled, false));

    const availablePins = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(pins)
      .where(eq(pins.status, "available"));

    return {
      memberCount: Number(memberCount[0]?.count ?? 0),
      activeMemberCount: Number(activeMemberCount[0]?.count ?? 0),
      totalWalletBalance: totalWalletBalance[0]?.total ?? "0",
      unsettledPV: unsettledTurnover[0]?.totalPV ?? "0",
      unsettledRupiah: unsettledTurnover[0]?.totalRupiah ?? "0",
      availablePins: Number(availablePins[0]?.count ?? 0),
    };
  }),

  /** Generate PINs in bulk */
  generatePins: adminProcedure
    .input(
      z.object({
        count: z.number().min(1).max(1000),
        pvValue: z.number().default(150),
        price: z.number().default(150000),
        stokisId: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const pinValues = [];
      for (let i = 0; i < input.count; i++) {
        pinValues.push({
          pin: nanoid(12).toUpperCase(),
          pvValue: String(input.pvValue),
          price: String(input.price),
          stokisId: input.stokisId ?? null,
          generatedByAdminId: ctx.memberProfile.id,
          status: "available" as const,
        });
      }

      const created = await ctx.db
        .insert(pins)
        .values(pinValues)
        .returning();

      // Log audit
      await ctx.db.insert(auditLog).values({
        userId: ctx.session.user.id,
        action: "generate_pins",
        entity: "pins",
        newValue: JSON.stringify({ count: input.count, stokisId: input.stokisId }),
      });

      return { count: created.length };
    }),

  /** List PINs */
  listPins: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        status: z.enum(["available", "used", "expired"]).optional(),
        stokisId: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.status) conditions.push(eq(pins.status, input.status));
      if (input.stokisId) conditions.push(eq(pins.stokisId, input.stokisId));

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const items = await ctx.db.query.pins.findMany({
        where,
        limit: input.limit,
        offset: input.offset,
        orderBy: desc(pins.createdAt),
      });

      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(pins)
        .where(where);

      return { pins: items, total: Number(countResult[0]?.count ?? 0) };
    }),

  /** Create/update company settings */
  upsertSetting: adminProcedure
    .input(
      z.object({
        key: z.string().min(1),
        value: z.string(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.companySettings.findFirst({
        where: eq(companySettings.key, input.key),
      });

      if (existing) {
        const [updated] = await ctx.db
          .update(companySettings)
          .set({ value: input.value, description: input.description })
          .where(eq(companySettings.key, input.key))
          .returning();
        return updated;
      }

      const [created] = await ctx.db
        .insert(companySettings)
        .values(input)
        .returning();
      return created;
    }),

  /** Get company settings */
  getSettings: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.query.companySettings.findMany();
  }),

  /** Create/update reward definitions */
  upsertReward: adminProcedure
    .input(
      z.object({
        id: z.number().optional(),
        name: z.string().min(1),
        description: z.string().optional(),
        requiredRank: z.enum([
          "none",
          "sapphire",
          "emerald",
          "bronze",
          "silver",
          "gold",
          "diamond",
          "crown",
        ]),
        requiredPV: z.number(),
        valueRupiah: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.id) {
        const [updated] = await ctx.db
          .update(rewards)
          .set({
            name: input.name,
            description: input.description,
            requiredRank: input.requiredRank,
            requiredPV: String(input.requiredPV),
            valueRupiah: String(input.valueRupiah),
          })
          .where(eq(rewards.id, input.id))
          .returning();
        return updated;
      }

      const [created] = await ctx.db
        .insert(rewards)
        .values({
          name: input.name,
          description: input.description,
          requiredRank: input.requiredRank,
          requiredPV: String(input.requiredPV),
          valueRupiah: String(input.valueRupiah),
        })
        .returning();
      return created;
    }),

  /** Get audit log */
  getAuditLog: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.query.auditLog.findMany({
        limit: input.limit,
        offset: input.offset,
        orderBy: desc(auditLog.createdAt),
        with: { user: true },
      });
    }),

  /** List products pending approval */
  listPendingProducts: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        status: z.enum(["pending", "approved", "rejected"]).optional().default("pending"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.status) conditions.push(eq(products.approvalStatus, input.status));

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const items = await ctx.db.query.products.findMany({
        where,
        with: { warung: { with: { user: true } } },
        limit: input.limit,
        offset: input.offset,
        orderBy: desc(products.createdAt),
      });

      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(where);

      return { products: items, total: Number(countResult[0]?.count ?? 0) };
    }),

  /** Approve a product */
  approveProduct: adminProcedure
    .input(z.object({ productId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.db.query.products.findFirst({
        where: eq(products.id, input.productId),
      });

      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Produk tidak ditemukan" });
      }

      const [updated] = await ctx.db
        .update(products)
        .set({
          approvalStatus: "approved",
          approvedById: ctx.memberProfile.id,
        })
        .where(eq(products.id, input.productId))
        .returning();

      // Notify product owner
      await ctx.db.insert(notifications).values({
        memberId: product.warungMemberId,
        title: "Produk Disetujui!",
        message: `Produk "${product.name}" telah disetujui dan sekarang tampil di halaman belanja.`,
        type: "system",
      });

      // Audit log
      await ctx.db.insert(auditLog).values({
        userId: ctx.session.user.id,
        action: "approve_product",
        entity: "products",
        entityId: input.productId,
      });

      return updated;
    }),

  /** Reject a product */
  rejectProduct: adminProcedure
    .input(
      z.object({
        productId: z.number(),
        reason: z.string().min(1, "Alasan penolakan wajib diisi"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.db.query.products.findFirst({
        where: eq(products.id, input.productId),
      });

      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Produk tidak ditemukan" });
      }

      const [updated] = await ctx.db
        .update(products)
        .set({
          approvalStatus: "rejected",
          rejectionReason: input.reason,
        })
        .where(eq(products.id, input.productId))
        .returning();

      // Notify product owner
      await ctx.db.insert(notifications).values({
        memberId: product.warungMemberId,
        title: "Produk Ditolak",
        message: `Produk "${product.name}" ditolak. Alasan: ${input.reason}`,
        type: "system",
      });

      // Audit log
      await ctx.db.insert(auditLog).values({
        userId: ctx.session.user.id,
        action: "reject_product",
        entity: "products",
        entityId: input.productId,
        newValue: JSON.stringify({ reason: input.reason }),
      });

      return updated;
    }),

  /** Create stokis */
  createStokis: adminProcedure
    .input(
      z.object({
        memberId: z.number(),
        name: z.string().min(1),
        address: z.string().optional(),
        phone: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get next stokis number
      const lastStokis = await ctx.db.query.stokis.findFirst({
        orderBy: desc(stokis.stokisNumber),
      });
      const nextNumber = (lastStokis?.stokisNumber ?? 0) + 1;

      // Update member role
      await ctx.db
        .update(memberProfiles)
        .set({ role: "stokis" })
        .where(eq(memberProfiles.id, input.memberId));

      const [created] = await ctx.db
        .insert(stokis)
        .values({
          memberId: input.memberId,
          stokisNumber: nextNumber,
          name: input.name,
          address: input.address,
          phone: input.phone,
          barcodeData: `STOKIS-${nextNumber}-${nanoid(8)}`,
        })
        .returning();

      return created;
    }),
});
