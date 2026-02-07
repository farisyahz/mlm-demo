import { z } from "zod";
import { eq, desc, and, sql, gte, lte } from "drizzle-orm";
import {
  createTRPCRouter,
  memberProcedure,
  adminProcedure,
} from "~/server/api/trpc";
import {
  wallets,
  transactions,
  bonuses,
  nationalTurnover,
} from "~/server/db/schema";

export const walletRouter = createTRPCRouter({
  /** Get current member's wallet */
  getMyWallet: memberProcedure.query(async ({ ctx }) => {
    return ctx.db.query.wallets.findFirst({
      where: eq(wallets.memberId, ctx.memberProfile.id),
    });
  }),

  /** Get transaction history */
  getTransactions: memberProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        type: z
          .enum([
            "pin_purchase",
            "product_purchase",
            "bonus_credit",
            "withdrawal",
            "transfer",
            "pv_stock",
            "coin_purchase",
            "registration",
            "repurchase",
          ])
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [
        eq(transactions.memberId, ctx.memberProfile.id),
      ];
      if (input.type) {
        conditions.push(eq(transactions.type, input.type));
      }

      const txns = await ctx.db.query.transactions.findMany({
        where: and(...conditions),
        limit: input.limit,
        offset: input.offset,
        orderBy: desc(transactions.createdAt),
      });

      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(transactions)
        .where(and(...conditions));

      return {
        transactions: txns,
        total: Number(countResult[0]?.count ?? 0),
      };
    }),

  /** Get bonus history */
  getBonuses: memberProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        type: z
          .enum([
            "sponsor",
            "pairing",
            "matching",
            "shu",
            "personal_shopping",
            "seracoin",
            "titik",
            "reward",
            "komunitas",
            "auto_system",
          ])
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(bonuses.memberId, ctx.memberProfile.id)];
      if (input.type) {
        conditions.push(eq(bonuses.type, input.type));
      }

      const bonusList = await ctx.db.query.bonuses.findMany({
        where: and(...conditions),
        limit: input.limit,
        offset: input.offset,
        orderBy: desc(bonuses.createdAt),
      });

      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(bonuses)
        .where(and(...conditions));

      return {
        bonuses: bonusList,
        total: Number(countResult[0]?.count ?? 0),
      };
    }),

  /** Get national turnover (admin / dashboard) */
  getNationalTurnover: memberProcedure.query(async ({ ctx }) => {
    // Get today's turnover
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayTurnover = await ctx.db.query.nationalTurnover.findFirst({
      where: and(
        gte(nationalTurnover.date, today),
        eq(nationalTurnover.isSettled, false),
      ),
    });

    // Get total unsettled turnover for current period
    const unsettled = await ctx.db
      .select({
        totalPV: sql<string>`COALESCE(SUM(${nationalTurnover.totalPV}), 0)`,
        totalRupiah: sql<string>`COALESCE(SUM(${nationalTurnover.totalRupiah}), 0)`,
      })
      .from(nationalTurnover)
      .where(eq(nationalTurnover.isSettled, false));

    return {
      todayPV: todayTurnover?.totalPV ?? "0",
      todayRupiah: todayTurnover?.totalRupiah ?? "0",
      periodPV: unsettled[0]?.totalPV ?? "0",
      periodRupiah: unsettled[0]?.totalRupiah ?? "0",
    };
  }),

  /** Admin: get all wallet balances summary */
  getAllWalletsSummary: adminProcedure.query(async ({ ctx }) => {
    const summary = await ctx.db
      .select({
        totalMainBalance: sql<string>`COALESCE(SUM(${wallets.mainBalance}), 0)`,
        totalCoinBalance: sql<string>`COALESCE(SUM(${wallets.coinBalance}), 0)`,
        totalFrozen: sql<string>`COALESCE(SUM(${wallets.frozenBalance}), 0)`,
        totalWithdrawn: sql<string>`COALESCE(SUM(${wallets.totalWithdrawn}), 0)`,
        memberCount: sql<number>`count(*)`,
      })
      .from(wallets);

    return summary[0];
  }),
});
