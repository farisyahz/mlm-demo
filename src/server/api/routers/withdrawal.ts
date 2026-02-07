import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  memberProcedure,
  bendaharaProcedure,
  direkturProcedure,
  adminProcedure,
} from "~/server/api/trpc";
import {
  withdrawals,
  wallets,
  notifications,
  transactions,
  memberProfiles,
} from "~/server/db/schema";

export const withdrawalRouter = createTRPCRouter({
  /** Request a withdrawal */
  request: memberProcedure
    .input(
      z.object({
        amount: z.number().positive().min(10000), // minimum Rp10,000
        bankName: z.string().min(1),
        accountNumber: z.string().min(1),
        accountHolder: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check wallet balance
      const wallet = await ctx.db.query.wallets.findFirst({
        where: eq(wallets.memberId, ctx.memberProfile.id),
      });

      if (
        !wallet ||
        Number(wallet.mainBalance) < input.amount
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Insufficient balance",
        });
      }

      // Freeze the amount
      await ctx.db
        .update(wallets)
        .set({
          mainBalance: sql`${wallets.mainBalance} - ${input.amount}`,
          frozenBalance: sql`${wallets.frozenBalance} + ${input.amount}`,
        })
        .where(eq(wallets.memberId, ctx.memberProfile.id));

      // Create withdrawal record
      const [withdrawal] = await ctx.db
        .insert(withdrawals)
        .values({
          memberId: ctx.memberProfile.id,
          amount: String(input.amount),
          bankName: input.bankName,
          accountNumber: input.accountNumber,
          accountHolder: input.accountHolder,
          status: "pending",
        })
        .returning();

      // Notify bendahara(s)
      const bendaharas = await ctx.db.query.memberProfiles.findMany({
        where: eq(memberProfiles.role, "bendahara"),
      });

      for (const b of bendaharas) {
        await ctx.db.insert(notifications).values({
          memberId: b.id,
          title: "Permintaan Penarikan Dana",
          message: `${ctx.session.user.name} meminta penarikan Rp${Number(input.amount).toLocaleString("id-ID")} ke ${input.bankName} ${input.accountNumber}`,
          type: "withdrawal_request",
          soundAlert: true,
        });
      }

      return withdrawal;
    }),

  /** Get my withdrawals */
  getMyWithdrawals: memberProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.db.query.withdrawals.findMany({
        where: eq(withdrawals.memberId, ctx.memberProfile.id),
        limit: input.limit,
        offset: input.offset,
        orderBy: desc(withdrawals.createdAt),
      });

      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(withdrawals)
        .where(eq(withdrawals.memberId, ctx.memberProfile.id));

      return { withdrawals: items, total: Number(countResult[0]?.count ?? 0) };
    }),

  /** Bendahara: list pending withdrawals */
  listPending: bendaharaProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.db.query.withdrawals.findMany({
        where: eq(withdrawals.status, "pending"),
        with: { member: { with: { user: true } } },
        limit: input.limit,
        offset: input.offset,
        orderBy: desc(withdrawals.createdAt),
      });

      return items;
    }),

  /** Bendahara: approve withdrawal (step 1) */
  bendaharaApprove: bendaharaProcedure
    .input(z.object({ withdrawalId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const withdrawal = await ctx.db.query.withdrawals.findFirst({
        where: and(
          eq(withdrawals.id, input.withdrawalId),
          eq(withdrawals.status, "pending"),
        ),
      });

      if (!withdrawal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Withdrawal not found or not pending",
        });
      }

      const [updated] = await ctx.db
        .update(withdrawals)
        .set({
          status: "bendahara_approved",
          bendaharaId: ctx.memberProfile.id,
          bendaharaApprovedAt: new Date(),
        })
        .where(eq(withdrawals.id, input.withdrawalId))
        .returning();

      // Notify direktur(s)
      const direkturs = await ctx.db.query.memberProfiles.findMany({
        where: eq(memberProfiles.role, "direktur"),
      });
      for (const d of direkturs) {
        await ctx.db.insert(notifications).values({
          memberId: d.id,
          title: "Penarikan Menunggu Persetujuan Direktur",
          message: `Penarikan Rp${Number(withdrawal.amount).toLocaleString("id-ID")} telah disetujui Bendahara. Menunggu persetujuan Direktur.`,
          type: "withdrawal_request",
          soundAlert: true,
        });
      }

      return updated;
    }),

  /** Direktur: list bendahara-approved withdrawals */
  listBendaharaApproved: direkturProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.query.withdrawals.findMany({
        where: eq(withdrawals.status, "bendahara_approved"),
        with: { member: { with: { user: true } } },
        limit: input.limit,
        offset: input.offset,
        orderBy: desc(withdrawals.createdAt),
      });
    }),

  /** Direktur: final approve and trigger payout (step 2) */
  direkturApprove: direkturProcedure
    .input(z.object({ withdrawalId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const withdrawal = await ctx.db.query.withdrawals.findFirst({
        where: and(
          eq(withdrawals.id, input.withdrawalId),
          eq(withdrawals.status, "bendahara_approved"),
        ),
        with: { member: true },
      });

      if (!withdrawal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Withdrawal not found or not yet approved by Bendahara",
        });
      }

      // Update status to processing
      const [updated] = await ctx.db
        .update(withdrawals)
        .set({
          status: "direktur_approved",
          direkturId: ctx.memberProfile.id,
          direkturApprovedAt: new Date(),
        })
        .where(eq(withdrawals.id, input.withdrawalId))
        .returning();

      // TODO: Trigger Xendit disbursement here
      // For now, mark as completed and deduct frozen balance
      await ctx.db
        .update(withdrawals)
        .set({
          status: "completed",
          completedAt: new Date(),
        })
        .where(eq(withdrawals.id, input.withdrawalId));

      // Deduct frozen balance
      await ctx.db
        .update(wallets)
        .set({
          frozenBalance: sql`${wallets.frozenBalance} - ${withdrawal.amount}`,
          totalWithdrawn: sql`${wallets.totalWithdrawn} + ${withdrawal.amount}`,
        })
        .where(eq(wallets.memberId, withdrawal.memberId));

      // Record transaction
      await ctx.db.insert(transactions).values({
        memberId: withdrawal.memberId,
        type: "withdrawal",
        amount: withdrawal.amount,
        description: `Penarikan ke ${withdrawal.bankName} ${withdrawal.accountNumber}`,
        status: "completed",
        referenceId: String(withdrawal.id),
      });

      // Notify member
      await ctx.db.insert(notifications).values({
        memberId: withdrawal.memberId,
        title: "Penarikan Dana Berhasil",
        message: `Penarikan Rp${Number(withdrawal.amount).toLocaleString("id-ID")} telah diproses ke ${withdrawal.bankName} ${withdrawal.accountNumber}`,
        type: "withdrawal_completed",
        soundAlert: true,
      });

      return updated;
    }),

  /** Reject withdrawal (bendahara or direktur) */
  reject: bendaharaProcedure
    .input(
      z.object({
        withdrawalId: z.number(),
        reason: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const withdrawal = await ctx.db.query.withdrawals.findFirst({
        where: eq(withdrawals.id, input.withdrawalId),
      });

      if (
        !withdrawal ||
        (withdrawal.status !== "pending" &&
          withdrawal.status !== "bendahara_approved")
      ) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Withdrawal not found or cannot be rejected",
        });
      }

      // Unfreeze balance
      await ctx.db
        .update(wallets)
        .set({
          mainBalance: sql`${wallets.mainBalance} + ${withdrawal.amount}`,
          frozenBalance: sql`${wallets.frozenBalance} - ${withdrawal.amount}`,
        })
        .where(eq(wallets.memberId, withdrawal.memberId));

      const [updated] = await ctx.db
        .update(withdrawals)
        .set({
          status: "rejected",
          rejectedById: ctx.memberProfile.id,
          rejectedAt: new Date(),
          rejectionReason: input.reason,
        })
        .where(eq(withdrawals.id, input.withdrawalId))
        .returning();

      // Notify member
      await ctx.db.insert(notifications).values({
        memberId: withdrawal.memberId,
        title: "Penarikan Dana Ditolak",
        message: `Penarikan Rp${Number(withdrawal.amount).toLocaleString("id-ID")} ditolak. Alasan: ${input.reason}`,
        type: "withdrawal_rejected",
        soundAlert: true,
      });

      return updated;
    }),
});
