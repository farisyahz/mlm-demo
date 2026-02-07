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
 * Pairing Bonus: 20% from matched pairs (1 left + 1 right).
 *
 * Requirements:
 * - Member's personal PV >= 150
 * - Recruit's PV >= 150
 *
 * Formula: matched PV (min of left, right new PV) x 20% / eligible members
 *
 * This runs periodically (daily via QStash cron).
 */
export async function calculatePairingBonuses(): Promise<{
  processed: number;
  totalDistributed: number;
}> {
  // Get all members who qualify (personal PV >= 150)
  const eligibleMembers = await db.query.memberProfiles.findMany({
    where: gte(memberProfiles.accumulatedPV, "150"),
    with: { treeNode: true },
  });

  let processed = 0;
  let totalDistributed = 0;

  for (const member of eligibleMembers) {
    if (!member.treeNode) continue;

    const leftPV = Number(member.treeNode.leftGroupPV);
    const rightPV = Number(member.treeNode.rightGroupPV);

    // Pairing = min of left and right
    const pairedPV = Math.min(leftPV, rightPV);
    if (pairedPV <= 0) continue;

    const bonusRate = 0.2; // 20%
    const bonusAmount = pairedPV * bonusRate * 1000; // Convert PV to Rupiah

    if (bonusAmount <= 0) continue;

    // Record bonus
    await db.insert(bonuses).values({
      memberId: member.id,
      type: "pairing",
      amount: String(bonusAmount),
      pvBasis: String(pairedPV),
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
      pvAmount: String(pairedPV),
      description: `Bonus Pasangan 20% dari ${pairedPV} PV paired`,
      status: "completed",
    });

    // Reset the paired PV (flush matched amounts)
    const flushed = pairedPV;
    await db
      .update(binaryTree)
      .set({
        leftGroupPV: sql`${binaryTree.leftGroupPV} - ${flushed}`,
        rightGroupPV: sql`${binaryTree.rightGroupPV} - ${flushed}`,
      })
      .where(eq(binaryTree.id, member.treeNode.id));

    // Notify
    await db.insert(notifications).values({
      memberId: member.id,
      title: "Bonus Pasangan Diterima",
      message: `Anda menerima bonus pasangan Rp${bonusAmount.toLocaleString("id-ID")}`,
      type: "bonus_received",
    });

    // Trigger matching bonus for sponsor
    await calculateMatchingBonus(member.id, bonusAmount);

    processed++;
    totalDistributed += bonusAmount;
  }

  return { processed, totalDistributed };
}

/**
 * Matching Bonus: 20% x direct recruit's pairing bonus.
 * Called automatically when a pairing bonus is distributed.
 */
async function calculateMatchingBonus(
  memberId: number,
  pairingBonusAmount: number,
): Promise<void> {
  const member = await db.query.memberProfiles.findFirst({
    where: eq(memberProfiles.id, memberId),
  });

  if (!member?.sponsorId) return;

  const sponsor = await db.query.memberProfiles.findFirst({
    where: eq(memberProfiles.id, member.sponsorId),
  });

  if (!sponsor) return;

  const matchingRate = 0.2; // 20%
  const matchingAmount = pairingBonusAmount * matchingRate;

  if (matchingAmount <= 0) return;

  // Record bonus
  await db.insert(bonuses).values({
    memberId: sponsor.id,
    type: "matching",
    amount: String(matchingAmount),
    pvBasis: String(pairingBonusAmount),
    sourceMemberId: memberId,
    status: "completed",
  });

  // Credit wallet
  await db
    .update(wallets)
    .set({
      mainBalance: sql`${wallets.mainBalance} + ${matchingAmount}`,
    })
    .where(eq(wallets.memberId, sponsor.id));

  // Record transaction
  await db.insert(transactions).values({
    memberId: sponsor.id,
    type: "bonus_credit",
    amount: String(matchingAmount),
    description: `Bonus Matching 20% dari bonus pasangan downline`,
    status: "completed",
  });

  // Notify
  await db.insert(notifications).values({
    memberId: sponsor.id,
    title: "Bonus Matching Diterima",
    message: `Anda menerima bonus matching Rp${matchingAmount.toLocaleString("id-ID")}`,
    type: "bonus_received",
  });
}
