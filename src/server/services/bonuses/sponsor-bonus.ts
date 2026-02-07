import { eq, sql } from "drizzle-orm";
import { db } from "~/server/db";
import {
  memberProfiles,
  bonuses,
  wallets,
  transactions,
  notifications,
} from "~/server/db/schema";

/**
 * Sponsor Bonus: 20% x recruited member's purchase PV.
 * Triggered when a new recruit makes their first purchase or at registration.
 *
 * @param recruitMemberId - The member who just purchased/registered
 * @param purchasePV - The PV amount of the purchase
 */
export async function calculateSponsorBonus(
  recruitMemberId: number,
  purchasePV: number,
): Promise<void> {
  const recruit = await db.query.memberProfiles.findFirst({
    where: eq(memberProfiles.id, recruitMemberId),
  });

  if (!recruit?.sponsorId) return;

  const sponsor = await db.query.memberProfiles.findFirst({
    where: eq(memberProfiles.id, recruit.sponsorId),
  });

  if (!sponsor) return;

  const bonusRate = 0.2; // 20%
  const bonusAmount = purchasePV * bonusRate * 1000; // PV * rate * 1000 (1 PV = Rp1,000)

  if (bonusAmount <= 0) return;

  // Record bonus
  await db.insert(bonuses).values({
    memberId: sponsor.id,
    type: "sponsor",
    amount: String(bonusAmount),
    pvBasis: String(purchasePV),
    sourceMemberId: recruitMemberId,
    status: "completed",
  });

  // Credit wallet
  await db
    .update(wallets)
    .set({
      mainBalance: sql`${wallets.mainBalance} + ${bonusAmount}`,
    })
    .where(eq(wallets.memberId, sponsor.id));

  // Record transaction
  await db.insert(transactions).values({
    memberId: sponsor.id,
    type: "bonus_credit",
    amount: String(bonusAmount),
    pvAmount: String(purchasePV),
    description: `Bonus Sponsor 20% dari ${purchasePV} PV`,
    status: "completed",
  });

  // Notify sponsor
  await db.insert(notifications).values({
    memberId: sponsor.id,
    title: "Bonus Sponsor Diterima",
    message: `Anda menerima bonus sponsor Rp${bonusAmount.toLocaleString("id-ID")} dari member baru.`,
    type: "bonus_received",
    soundAlert: false,
  });
}
