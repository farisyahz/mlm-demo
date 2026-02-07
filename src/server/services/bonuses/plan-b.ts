import { eq, sql, and, gte } from "drizzle-orm";
import { db } from "~/server/db";
import {
  memberProfiles,
  binaryTree,
  bonuses,
  wallets,
  transactions,
  notifications,
} from "~/server/db/schema";

/**
 * Plan B - Auto System.
 *
 * Requirements:
 * - Accumulated PV >= 150
 *
 * Bonus per node (titik): Rp1,000/HU
 * Level 1 = 2 HU, Level 2 = 4 HU, ..., Level 20 = 1,048,576 HU
 *
 * Members are auto-placed in the binary tree.
 * Bonus is calculated based on total HU in the member's network.
 */

/**
 * Calculate Plan B titik bonus for all eligible members.
 */
export async function calculatePlanBBonuses(): Promise<{
  processed: number;
  totalDistributed: number;
}> {
  // Get all members who qualify (accumulated PV >= 150, planBActive)
  const eligibleMembers = await db.query.memberProfiles.findMany({
    where: and(
      gte(memberProfiles.accumulatedPV, "150"),
      eq(memberProfiles.isActive, true),
    ),
    with: { treeNode: true },
  });

  let processed = 0;
  let totalDistributed = 0;

  for (const member of eligibleMembers) {
    if (!member.treeNode) continue;

    // Activate Plan B if not already
    if (!member.planBActive) {
      await db
        .update(memberProfiles)
        .set({ planBActive: true })
        .where(eq(memberProfiles.id, member.id));
    }

    const totalHU = member.treeNode.leftGroupHU + member.treeNode.rightGroupHU;
    if (totalHU <= 0) continue;

    // Bonus = Rp1,000 per HU
    const bonusAmount = totalHU * 1000;

    // Record bonus
    await db.insert(bonuses).values({
      memberId: member.id,
      type: "titik",
      amount: String(bonusAmount),
      pvBasis: String(totalHU),
      status: "completed",
    });

    // Credit wallet
    await db
      .update(wallets)
      .set({
        mainBalance: sql`${wallets.mainBalance} + ${bonusAmount}`,
      })
      .where(eq(wallets.memberId, member.id));

    // Record transaction
    await db.insert(transactions).values({
      memberId: member.id,
      type: "bonus_credit",
      amount: String(bonusAmount),
      description: `Bonus Titik Plan B: ${totalHU} HU x Rp1.000`,
      status: "completed",
    });

    // Notify
    await db.insert(notifications).values({
      memberId: member.id,
      title: "Bonus Titik Plan B",
      message: `Anda menerima bonus titik Rp${bonusAmount.toLocaleString("id-ID")} (${totalHU} HU)`,
      type: "bonus_received",
    });

    processed++;
    totalDistributed += bonusAmount;
  }

  return { processed, totalDistributed };
}
