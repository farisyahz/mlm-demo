import { z } from "zod";
import { eq, desc, and, sql, gte, lte } from "drizzle-orm";
import {
  createTRPCRouter,
  memberProcedure,
  adminProcedure,
} from "~/server/api/trpc";
import {
  bonuses,
  memberSHU,
  shuPeriods,
  coins,
  memberProfiles,
} from "~/server/db/schema";

export const bonusRouter = createTRPCRouter({
  /** Get bonus summary for current member */
  getMySummary: memberProcedure.query(async ({ ctx }) => {
    const memberId = ctx.memberProfile.id;

    const summaryByType = await ctx.db
      .select({
        type: bonuses.type,
        total: sql<string>`COALESCE(SUM(${bonuses.amount}), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(bonuses)
      .where(eq(bonuses.memberId, memberId))
      .groupBy(bonuses.type);

    const totalBonus = await ctx.db
      .select({
        total: sql<string>`COALESCE(SUM(${bonuses.amount}), 0)`,
      })
      .from(bonuses)
      .where(eq(bonuses.memberId, memberId));

    return {
      byType: summaryByType,
      totalBonus: totalBonus[0]?.total ?? "0",
    };
  }),

  /** Get SHU info for current member */
  getMySHU: memberProcedure.query(async ({ ctx }) => {
    const memberId = ctx.memberProfile.id;

    // Current accumulated PV -> calculate SHU count
    const accPV = Number(ctx.memberProfile.accumulatedPV);
    const shuCount = calculateSHUCount(accPV);

    // Get latest SHU period
    const latestPeriod = await ctx.db.query.shuPeriods.findFirst({
      orderBy: desc(shuPeriods.periodEnd),
    });

    // Get member's SHU entries
    const myEntries = await ctx.db.query.memberSHU.findMany({
      where: eq(memberSHU.memberId, memberId),
      with: { period: true },
      orderBy: desc(memberSHU.createdAt),
    });

    return {
      currentSHUCount: shuCount,
      accumulatedPV: ctx.memberProfile.accumulatedPV,
      latestPeriod,
      entries: myEntries,
    };
  }),

  /** Get coin info for current member */
  getMyCoins: memberProcedure.query(async ({ ctx }) => {
    const memberId = ctx.memberProfile.id;

    const coinEntries = await ctx.db.query.coins.findMany({
      where: eq(coins.memberId, memberId),
      orderBy: desc(coins.createdAt),
    });

    const totalCoins = await ctx.db
      .select({
        earned: sql<string>`COALESCE(SUM(CASE WHEN ${coins.type} = 'earned' THEN ${coins.amount} ELSE 0 END), 0)`,
        purchased: sql<string>`COALESCE(SUM(CASE WHEN ${coins.type} = 'purchased' THEN ${coins.amount} ELSE 0 END), 0)`,
        sold: sql<string>`COALESCE(SUM(CASE WHEN ${coins.type} = 'sold' THEN ${coins.amount} ELSE 0 END), 0)`,
      })
      .from(coins)
      .where(eq(coins.memberId, memberId));

    return {
      entries: coinEntries,
      totalEarned: totalCoins[0]?.earned ?? "0",
      totalPurchased: totalCoins[0]?.purchased ?? "0",
      totalSold: totalCoins[0]?.sold ?? "0",
    };
  }),

  /** Admin: list all bonuses */
  listAll: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
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
        memberId: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.type) conditions.push(eq(bonuses.type, input.type));
      if (input.memberId)
        conditions.push(eq(bonuses.memberId, input.memberId));

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const items = await ctx.db.query.bonuses.findMany({
        where,
        with: { member: { with: { user: true } } },
        limit: input.limit,
        offset: input.offset,
        orderBy: desc(bonuses.createdAt),
      });

      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(bonuses)
        .where(where);

      return { bonuses: items, total: Number(countResult[0]?.count ?? 0) };
    }),

  /** Admin: get bonus distribution summary */
  getDistributionSummary: adminProcedure.query(async ({ ctx }) => {
    const summary = await ctx.db
      .select({
        type: bonuses.type,
        totalAmount: sql<string>`COALESCE(SUM(${bonuses.amount}), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(bonuses)
      .groupBy(bonuses.type);

    return summary;
  }),
});

/**
 * Calculate SHU count based on accumulated PV tiers.
 *
 * Tiers:
 * 10 PV   -> 1 SHU
 * 35 PV   -> 2 SHU
 * 85 PV   -> 4 SHU
 * 150 PV  -> 6 SHU
 * 300 PV  -> 8 SHU
 * 450 PV  -> 10 SHU
 * 750 PV  -> 15 SHU
 * 1200 PV -> 25 SHU
 * 1750 PV -> 35 SHU
 * 2250 PV -> 50 SHU
 * 3000 PV -> 100 SHU
 */
export function calculateSHUCount(accumulatedPV: number): number {
  if (accumulatedPV >= 3000) return 100;
  if (accumulatedPV >= 2250) return 50;
  if (accumulatedPV >= 1750) return 35;
  if (accumulatedPV >= 1200) return 25;
  if (accumulatedPV >= 750) return 15;
  if (accumulatedPV >= 450) return 10;
  if (accumulatedPV >= 300) return 8;
  if (accumulatedPV >= 150) return 6;
  if (accumulatedPV >= 85) return 4;
  if (accumulatedPV >= 35) return 2;
  if (accumulatedPV >= 10) return 1;
  return 0;
}
