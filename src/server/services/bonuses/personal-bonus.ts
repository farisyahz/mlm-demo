import { eq, sql } from "drizzle-orm";
import { db } from "~/server/db";
import {
  memberProfiles,
  bonuses,
  wallets,
  transactions,
} from "~/server/db/schema";

/**
 * Personal Shopping Bonus: 15% x personal PV purchase.
 * Credited immediately on each purchase.
 *
 * @param memberId - The member who made the purchase
 * @param purchasePV - The PV of the purchase
 */
export async function calculatePersonalBonus(
  memberId: number,
  purchasePV: number,
): Promise<void> {
  const bonusRate = 0.15; // 15%
  const bonusAmount = purchasePV * bonusRate * 1000; // 1 PV = Rp1,000

  if (bonusAmount <= 0) return;

  // Record bonus
  await db.insert(bonuses).values({
    memberId,
    type: "personal_shopping",
    amount: String(bonusAmount),
    pvBasis: String(purchasePV),
    status: "completed",
  });

  // Credit wallet
  await db
    .update(wallets)
    .set({
      mainBalance: sql`${wallets.mainBalance} + ${bonusAmount}`,
    })
    .where(eq(wallets.memberId, memberId));

  // Record transaction
  await db.insert(transactions).values({
    memberId,
    type: "bonus_credit",
    amount: String(bonusAmount),
    pvAmount: String(purchasePV),
    description: `Bonus Belanja Pribadi 15% dari ${purchasePV} PV`,
    status: "completed",
  });
}
