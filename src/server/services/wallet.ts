import { eq, sql } from "drizzle-orm";
import { db } from "~/server/db";
import {
  wallets,
  transactions,
  nationalTurnover,
  memberProfiles,
} from "~/server/db/schema";

/**
 * Create a wallet for a new member.
 */
export async function createWallet(memberId: number) {
  const [wallet] = await db
    .insert(wallets)
    .values({ memberId })
    .returning();
  return wallet;
}

/**
 * Credit a member's main balance.
 */
export async function creditBalance(
  memberId: number,
  amount: number,
  description: string,
  type: "bonus_credit" | "transfer" = "bonus_credit",
): Promise<void> {
  await db
    .update(wallets)
    .set({
      mainBalance: sql`${wallets.mainBalance} + ${amount}`,
    })
    .where(eq(wallets.memberId, memberId));

  await db.insert(transactions).values({
    memberId,
    type,
    amount: String(amount),
    description,
    status: "completed",
  });
}

/**
 * Debit a member's main balance.
 */
export async function debitBalance(
  memberId: number,
  amount: number,
  description: string,
  type:
    | "pin_purchase"
    | "product_purchase"
    | "withdrawal"
    | "pv_stock"
    | "coin_purchase" = "product_purchase",
): Promise<boolean> {
  const wallet = await db.query.wallets.findFirst({
    where: eq(wallets.memberId, memberId),
  });

  if (!wallet || Number(wallet.mainBalance) < amount) {
    return false;
  }

  await db
    .update(wallets)
    .set({
      mainBalance: sql`${wallets.mainBalance} - ${amount}`,
    })
    .where(eq(wallets.memberId, memberId));

  await db.insert(transactions).values({
    memberId,
    type,
    amount: String(-amount),
    description,
    status: "completed",
  });

  return true;
}

/**
 * Add PV to national turnover.
 * Called on every transaction that generates PV.
 * 1 PV = Rp1,000
 */
export async function addToNationalTurnover(pvAmount: number): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rupiahAmount = pvAmount * 1000;

  // Check if today's entry exists
  const existing = await db.query.nationalTurnover.findFirst({
    where: eq(nationalTurnover.date, today),
  });

  if (existing) {
    await db
      .update(nationalTurnover)
      .set({
        totalPV: sql`${nationalTurnover.totalPV} + ${pvAmount}`,
        totalRupiah: sql`${nationalTurnover.totalRupiah} + ${rupiahAmount}`,
      })
      .where(eq(nationalTurnover.id, existing.id));
  } else {
    await db.insert(nationalTurnover).values({
      date: today,
      totalPV: String(pvAmount),
      totalRupiah: String(rupiahAmount),
      periodType: "daily",
    });
  }
}

/**
 * Process a product purchase: update PV, wallet, and national turnover.
 */
export async function processPurchase(
  memberId: number,
  priceRupiah: number,
  pvAmount: number,
  description: string,
): Promise<void> {
  // 1. Record transaction
  await db.insert(transactions).values({
    memberId,
    type: "product_purchase",
    amount: String(priceRupiah),
    pvAmount: String(pvAmount),
    description,
    status: "completed",
  });

  // 2. Update member's personal PV
  await db
    .update(memberProfiles)
    .set({
      personalPV: sql`${memberProfiles.personalPV} + ${pvAmount}`,
      accumulatedPV: sql`${memberProfiles.accumulatedPV} + ${pvAmount}`,
      weeklyRepurchasePV: sql`${memberProfiles.weeklyRepurchasePV} + ${pvAmount}`,
    })
    .where(eq(memberProfiles.id, memberId));

  // 3. Add to national turnover
  await addToNationalTurnover(pvAmount);
}
