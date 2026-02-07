import { eq, sql, and, gte } from "drizzle-orm";
import { db } from "~/server/db";
import {
  memberProfiles,
  bonuses,
  wallets,
  transactions,
  notifications,
  nationalTurnover,
  shuPeriods,
  memberSHU,
} from "~/server/db/schema";
import { calculateSHUCount } from "~/server/api/routers/bonus";

/**
 * SHU (Sisa Hasil Usaha) Bonus Settlement.
 *
 * Formula: 20% of national PV turnover / total SHU count across all members.
 *
 * Requirements:
 * - Member accumulated PV >= 10 (minimum 1 SHU)
 * - Member must have weekly repurchase >= 15 PV
 *
 * SHU Count tiers are defined in calculateSHUCount().
 *
 * Runs bi-weekly (every 2 weeks on Saturday 00:00).
 */
export async function settleSHU(
  periodStart: Date,
  periodEnd: Date,
): Promise<{
  totalDistributed: number;
  membersProcessed: number;
  perSHUValue: number;
}> {
  // 1. Calculate total national PV for the period
  const turnoverResult = await db
    .select({
      totalPV: sql<string>`COALESCE(SUM(${nationalTurnover.totalPV}), 0)`,
    })
    .from(nationalTurnover)
    .where(
      and(
        eq(nationalTurnover.isSettled, false),
        gte(nationalTurnover.date, periodStart),
      ),
    );

  const totalNationalPV = Number(turnoverResult[0]?.totalPV ?? 0);
  if (totalNationalPV <= 0) {
    return { totalDistributed: 0, membersProcessed: 0, perSHUValue: 0 };
  }

  // 2. Get eligible members (accumulated PV >= 10, active weekly repurchase)
  const eligibleMembers = await db.query.memberProfiles.findMany({
    where: and(
      gte(memberProfiles.accumulatedPV, "10"),
      eq(memberProfiles.isActive, true),
    ),
  });

  // Filter members who have weekly repurchase >= 15 PV
  const qualifiedMembers = eligibleMembers.filter(
    (m) => Number(m.weeklyRepurchasePV) >= 15,
  );

  // 3. Calculate total SHU count
  let totalSHUCount = 0;
  const memberSHUData: { memberId: number; shuCount: number }[] = [];

  for (const member of qualifiedMembers) {
    const shuCount = calculateSHUCount(Number(member.accumulatedPV));
    if (shuCount > 0) {
      totalSHUCount += shuCount;
      memberSHUData.push({ memberId: member.id, shuCount });
    }
  }

  if (totalSHUCount <= 0) {
    return { totalDistributed: 0, membersProcessed: 0, perSHUValue: 0 };
  }

  // 4. Calculate per-SHU value: 20% of national PV * 1000 (Rupiah) / total SHU
  const shuPool = totalNationalPV * 0.2 * 1000;
  const perSHUValue = shuPool / totalSHUCount;

  // 5. Create SHU period record
  const [period] = await db
    .insert(shuPeriods)
    .values({
      periodStart,
      periodEnd,
      totalPV: String(totalNationalPV),
      totalSHUCount,
      perSHUValue: String(perSHUValue),
      isSettled: true,
      settledAt: new Date(),
    })
    .returning();

  // 6. Distribute to each member
  let totalDistributed = 0;

  for (const { memberId, shuCount } of memberSHUData) {
    const bonusAmount = perSHUValue * shuCount;

    // Record member SHU
    await db.insert(memberSHU).values({
      memberId,
      periodId: period!.id,
      shuCount,
      bonusPaid: String(bonusAmount),
    });

    // Record bonus
    await db.insert(bonuses).values({
      memberId,
      type: "shu",
      amount: String(bonusAmount),
      pvBasis: String(totalNationalPV),
      periodStart,
      periodEnd,
      status: "completed",
    });

    // Credit wallet
    await db
      .update(wallets)
      .set({
        mainBalance: sql`${wallets.mainBalance} + ${bonusAmount}`,
      })
      .where(eq(wallets.memberId, memberId));

    // Transaction record
    await db.insert(transactions).values({
      memberId,
      type: "bonus_credit",
      amount: String(bonusAmount),
      description: `Bonus SHU: ${shuCount} SHU x Rp${perSHUValue.toFixed(0)}`,
      status: "completed",
    });

    // Notify
    await db.insert(notifications).values({
      memberId,
      title: "Bonus SHU Diterima",
      message: `Anda menerima bonus SHU Rp${bonusAmount.toLocaleString("id-ID")} (${shuCount} SHU)`,
      type: "bonus_received",
    });

    totalDistributed += bonusAmount;
  }

  // 7. Mark national turnover as settled
  await db
    .update(nationalTurnover)
    .set({ isSettled: true, settledAt: new Date() })
    .where(
      and(
        eq(nationalTurnover.isSettled, false),
        gte(nationalTurnover.date, periodStart),
      ),
    );

  return {
    totalDistributed,
    membersProcessed: memberSHUData.length,
    perSHUValue,
  };
}
