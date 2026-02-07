import { eq, sql, and, gte } from "drizzle-orm";
import { db } from "~/server/db";
import {
  memberProfiles,
  binaryTree,
  bonuses,
  wallets,
  coins,
  notifications,
  nationalTurnover,
} from "~/server/db/schema";

/**
 * SERACOIN Bonus: 10% of national PV turnover, distributed as coins.
 *
 * Requirements:
 * - Accumulated PV >= 150
 * - Coin count determined by left/right HU balance (16 tiers)
 *
 * Tiers:
 * 1/1 HU -> 1 coin
 * 7/7 HU -> 2 coins
 * 15/15 HU -> 3 coins
 * 50/50 HU -> 4 coins
 * 150/150 HU -> 6 coins
 * 250/250 HU -> 8 coins
 * 350/350 HU -> 10 coins
 * 750/750 HU -> 12 coins
 * 1250/1250 HU -> 15 coins
 * 1750/1750 HU -> 20 coins
 * 2500/2500 HU -> 30 coins
 * 3500/3500 HU -> 50 coins
 * 7500/7500 HU -> 75 coins
 * 10000/10000 HU -> 100 coins
 * 15000/15000 HU -> 150 coins
 * 25000/25000 HU -> 200 coins
 */
const COIN_TIERS = [
  { hu: 25000, coins: 200 },
  { hu: 15000, coins: 150 },
  { hu: 10000, coins: 100 },
  { hu: 7500, coins: 75 },
  { hu: 3500, coins: 50 },
  { hu: 2500, coins: 30 },
  { hu: 1750, coins: 20 },
  { hu: 1250, coins: 15 },
  { hu: 750, coins: 12 },
  { hu: 350, coins: 10 },
  { hu: 250, coins: 8 },
  { hu: 150, coins: 6 },
  { hu: 50, coins: 4 },
  { hu: 15, coins: 3 },
  { hu: 7, coins: 2 },
  { hu: 1, coins: 1 },
];

/**
 * Calculate how many coins a member earns based on their left/right HU balance.
 */
export function calculateCoinTier(leftHU: number, rightHU: number): number {
  const balancedHU = Math.min(leftHU, rightHU);

  for (const tier of COIN_TIERS) {
    if (balancedHU >= tier.hu) return tier.coins;
  }

  return 0;
}

/**
 * Distribute SERACOIN bonuses.
 * Pool = 10% of national PV turnover * Rp1000.
 * Coin value = pool / total coins distributed.
 *
 * Runs periodically (e.g., bi-weekly with SHU settlement).
 */
export async function distributeSeracoinBonuses(
  periodStart: Date,
): Promise<{
  totalCoinsDistributed: number;
  pricePerCoin: number;
  membersProcessed: number;
}> {
  // 1. Get unsettled national PV
  const turnoverResult = await db
    .select({
      totalPV: sql<string>`COALESCE(SUM(${nationalTurnover.totalPV}), 0)`,
    })
    .from(nationalTurnover)
    .where(eq(nationalTurnover.isSettled, false));

  const totalNationalPV = Number(turnoverResult[0]?.totalPV ?? 0);
  if (totalNationalPV <= 0) {
    return { totalCoinsDistributed: 0, pricePerCoin: 0, membersProcessed: 0 };
  }

  // Pool = 10% of national PV * Rp1000
  const coinPool = totalNationalPV * 0.1 * 1000;

  // 2. Get eligible members (accumulated PV >= 150 with tree nodes)
  const eligibleMembers = await db.query.memberProfiles.findMany({
    where: and(
      gte(memberProfiles.accumulatedPV, "150"),
      eq(memberProfiles.isActive, true),
    ),
    with: { treeNode: true },
  });

  // 3. Calculate total coins to distribute
  let totalCoins = 0;
  const memberCoinData: { memberId: number; coinCount: number }[] = [];

  for (const member of eligibleMembers) {
    if (!member.treeNode) continue;

    const coinCount = calculateCoinTier(
      member.treeNode.leftGroupHU,
      member.treeNode.rightGroupHU,
    );

    if (coinCount > 0) {
      totalCoins += coinCount;
      memberCoinData.push({ memberId: member.id, coinCount });
    }
  }

  if (totalCoins <= 0) {
    return { totalCoinsDistributed: 0, pricePerCoin: 0, membersProcessed: 0 };
  }

  const pricePerCoin = coinPool / totalCoins;

  // 4. Distribute coins
  for (const { memberId, coinCount } of memberCoinData) {
    // Record coin earning
    await db.insert(coins).values({
      memberId,
      amount: String(coinCount),
      type: "earned",
      pricePerCoin: String(pricePerCoin),
      description: `SERACOIN bonus: ${coinCount} coins`,
    });

    // Update wallet coin balance
    await db
      .update(wallets)
      .set({
        coinBalance: sql`${wallets.coinBalance} + ${coinCount}`,
      })
      .where(eq(wallets.memberId, memberId));

    // Notify
    await db.insert(notifications).values({
      memberId,
      title: "SERACOIN Diterima",
      message: `Anda menerima ${coinCount} SERACOIN (nilai Rp${(coinCount * pricePerCoin).toLocaleString("id-ID")})`,
      type: "bonus_received",
    });
  }

  return {
    totalCoinsDistributed: totalCoins,
    pricePerCoin,
    membersProcessed: memberCoinData.length,
  };
}
