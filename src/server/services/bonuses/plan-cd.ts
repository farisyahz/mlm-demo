import { eq, sql, and, gte } from "drizzle-orm";
import { db } from "~/server/db";
import {
  memberProfiles,
  binaryTree,
  bonuses,
  wallets,
  transactions,
  notifications,
  rankHistory,
  rewards,
  memberRewards,
} from "~/server/db/schema";

/**
 * Rank definitions based on accumulated PV.
 */
const RANK_THRESHOLDS: { rank: string; pv: number }[] = [
  { rank: "crown", pv: 3000 },
  { rank: "diamond", pv: 1000 },
  { rank: "gold", pv: 700 },
  { rank: "silver", pv: 500 },
  { rank: "bronze", pv: 280 },
  { rank: "emerald", pv: 200 },
  { rank: "sapphire", pv: 150 },
];

/**
 * Calculate current rank based on accumulated PV.
 */
export function calculateRank(
  accumulatedPV: number,
): "none" | "sapphire" | "emerald" | "bronze" | "silver" | "gold" | "diamond" | "crown" {
  for (const tier of RANK_THRESHOLDS) {
    if (accumulatedPV >= tier.pv) {
      return tier.rank as any;
    }
  }
  return "none";
}

/**
 * Plan C: Activates at 7 left + 7 right with 150 PV each.
 *
 * Layer-based bonus simulation:
 * Layer 1: 2 accounts
 * Layer 2: 4 accounts
 * ...
 * Layer 10: 1024 accounts
 *
 * Bonus = titik RO + reward + komunitas + auto system
 */
export async function checkAndActivatePlanC(memberId: number): Promise<boolean> {
  const member = await db.query.memberProfiles.findFirst({
    where: eq(memberProfiles.id, memberId),
    with: { treeNode: true },
  });

  if (!member?.treeNode) return false;

  // Check: 7 left and 7 right HU
  if (member.treeNode.leftGroupHU >= 7 && member.treeNode.rightGroupHU >= 7) {
    if (!member.planCActive) {
      await db
        .update(memberProfiles)
        .set({ planCActive: true })
        .where(eq(memberProfiles.id, memberId));

      await db.insert(notifications).values({
        memberId,
        title: "Plan C Aktif!",
        message:
          "Selamat! Anda telah mengaktifkan Plan C. Bonus titik RO, reward, dan komunitas sekarang tersedia.",
        type: "system",
      });
    }
    return true;
  }
  return false;
}

/**
 * Plan D: Activates at 15 left + 15 right.
 * Extended binary with additional bonus tiers.
 */
export async function checkAndActivatePlanD(memberId: number): Promise<boolean> {
  const member = await db.query.memberProfiles.findFirst({
    where: eq(memberProfiles.id, memberId),
    with: { treeNode: true },
  });

  if (!member?.treeNode) return false;

  if (member.treeNode.leftGroupHU >= 15 && member.treeNode.rightGroupHU >= 15) {
    if (!member.planDActive) {
      await db
        .update(memberProfiles)
        .set({ planDActive: true })
        .where(eq(memberProfiles.id, memberId));

      await db.insert(notifications).values({
        memberId,
        title: "Plan D Aktif!",
        message:
          "Selamat! Anda telah mengaktifkan Plan D. Bonus tambahan sekarang tersedia.",
        type: "system",
      });
    }
    return true;
  }
  return false;
}

/**
 * Process rank upgrades for all eligible members.
 * Also checks Plan C and Plan D activation.
 */
export async function processRankUpgrades(): Promise<{
  upgraded: number;
  planCActivated: number;
  planDActivated: number;
}> {
  const members = await db.query.memberProfiles.findMany({
    where: eq(memberProfiles.isActive, true),
    with: { treeNode: true },
  });

  let upgraded = 0;
  let planCActivated = 0;
  let planDActivated = 0;

  for (const member of members) {
    const accPV = Number(member.accumulatedPV);
    const newRank = calculateRank(accPV);

    // Check rank upgrade
    if (newRank !== member.rank && newRank !== "none") {
      const rankOrder = ["none", "sapphire", "emerald", "bronze", "silver", "gold", "diamond", "crown"];
      const currentIdx = rankOrder.indexOf(member.rank);
      const newIdx = rankOrder.indexOf(newRank);

      if (newIdx > currentIdx) {
        await db
          .update(memberProfiles)
          .set({ rank: newRank })
          .where(eq(memberProfiles.id, member.id));

        await db.insert(rankHistory).values({
          memberId: member.id,
          rank: newRank,
        });

        await db.insert(notifications).values({
          memberId: member.id,
          title: "Naik Peringkat!",
          message: `Selamat! Anda naik peringkat ke ${newRank.toUpperCase()}`,
          type: "rank_up",
          soundAlert: true,
        });

        // Check for reward eligibility
        const availableRewards = await db.query.rewards.findMany({
          where: eq(rewards.requiredRank, newRank),
        });

        for (const reward of availableRewards) {
          if (accPV >= Number(reward.requiredPV)) {
            const existing = await db.query.memberRewards.findFirst({
              where: and(
                eq(memberRewards.memberId, member.id),
                eq(memberRewards.rewardId, reward.id),
              ),
            });
            if (!existing) {
              await db.insert(memberRewards).values({
                memberId: member.id,
                rewardId: reward.id,
                status: "pending",
              });

              await db.insert(notifications).values({
                memberId: member.id,
                title: "Reward Tersedia!",
                message: `Anda berhak mendapatkan reward: ${reward.name}`,
                type: "system",
                soundAlert: true,
              });
            }
          }
        }

        upgraded++;
      }
    }

    // Check Plan C and D activation
    if (member.treeNode) {
      if (!member.planCActive) {
        const activated = await checkAndActivatePlanC(member.id);
        if (activated) planCActivated++;
      }
      if (!member.planDActive) {
        const activated = await checkAndActivatePlanD(member.id);
        if (activated) planDActivated++;
      }
    }
  }

  return { upgraded, planCActivated, planDActivated };
}

/**
 * Calculate Plan C bonus for eligible members.
 * Bonus = based on layer depth and network size.
 */
export async function calculatePlanCBonuses(): Promise<{
  processed: number;
  totalDistributed: number;
}> {
  const eligibleMembers = await db.query.memberProfiles.findMany({
    where: and(
      eq(memberProfiles.planCActive, true),
      eq(memberProfiles.isActive, true),
    ),
    with: { treeNode: true },
  });

  let processed = 0;
  let totalDistributed = 0;

  for (const member of eligibleMembers) {
    if (!member.treeNode) continue;

    // Calculate bonus based on balanced HU (RO system)
    const balancedHU = Math.min(
      member.treeNode.leftGroupHU,
      member.treeNode.rightGroupHU,
    );
    if (balancedHU <= 0) continue;

    // RO bonus: Rp2,000 per balanced HU pair
    const bonusAmount = balancedHU * 2000;

    await db.insert(bonuses).values({
      memberId: member.id,
      type: "komunitas",
      amount: String(bonusAmount),
      pvBasis: String(balancedHU),
      status: "completed",
    });

    await db
      .update(wallets)
      .set({
        mainBalance: sql`${wallets.mainBalance} + ${bonusAmount}`,
      })
      .where(eq(wallets.memberId, member.id));

    await db.insert(transactions).values({
      memberId: member.id,
      type: "bonus_credit",
      amount: String(bonusAmount),
      description: `Bonus Komunitas Plan C: ${balancedHU} balanced HU`,
      status: "completed",
    });

    processed++;
    totalDistributed += bonusAmount;
  }

  return { processed, totalDistributed };
}
