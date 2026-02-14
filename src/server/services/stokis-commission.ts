import { eq, sql } from "drizzle-orm";
import { stokis, wallets, transactions, notifications } from "~/server/db/schema";

/**
 * Sistem Komisi Stokis - Bertingkat (Tiered)
 *
 * Berdasarkan total PV yang dijual oleh stokis:
 *   - Tier 1: 0 - 100 PV   → 4% dari nilai rupiah PV
 *   - Tier 2: 101 - 300 PV  → 2% dari nilai rupiah PV
 *   - Tier 3: 301+ PV       → 1% dari nilai rupiah PV
 *
 * Jika stokis menjual lebih dari 300 PV, mereka mendapat komisi dari ketiga tier.
 * 1 PV = Rp1.000
 *
 * Contoh: Stokis menjual total 350 PV
 *   - Tier 1: 100 PV × Rp1.000 × 4%  = Rp4.000
 *   - Tier 2: 200 PV × Rp1.000 × 2%  = Rp4.000
 *   - Tier 3: 50 PV  × Rp1.000 × 1%  = Rp500
 *   - Total komisi: Rp8.500
 */

const PV_TO_RUPIAH = 1000; // 1 PV = Rp1.000

const COMMISSION_TIERS = [
  { maxPV: 100, rate: 0.04 },  // 0 - 100 PV: 4%
  { maxPV: 300, rate: 0.02 },  // 101 - 300 PV: 2%
  { maxPV: Infinity, rate: 0.01 }, // 301+ PV: 1%
];

/**
 * Hitung komisi bertingkat untuk penjualan PV baru.
 *
 * @param previousTotalPV - Total PV yang sudah dijual sebelum transaksi ini
 * @param newPV - Jumlah PV baru yang dijual dalam transaksi ini
 * @returns Komisi dalam Rupiah
 */
export function calculateTieredCommission(
  previousTotalPV: number,
  newPV: number,
): number {
  let commission = 0;
  let remaining = newPV;
  let position = previousTotalPV;
  let tierStart = 0;

  for (const tier of COMMISSION_TIERS) {
    if (remaining <= 0) break;

    // Berapa banyak slot tersisa di tier ini
    const tierCapacity = tier.maxPV - Math.max(position, tierStart);

    if (tierCapacity <= 0) {
      tierStart = tier.maxPV;
      continue;
    }

    const pvInThisTier = Math.min(remaining, tierCapacity);
    commission += pvInThisTier * PV_TO_RUPIAH * tier.rate;

    remaining -= pvInThisTier;
    position += pvInThisTier;
    tierStart = tier.maxPV;
  }

  return Math.round(commission);
}

/**
 * Dapatkan label tier dan rate untuk posisi PV tertentu.
 */
export function getCurrentTierInfo(totalPVSold: number): {
  tier: number;
  rate: number;
  label: string;
} {
  if (totalPVSold <= 100) {
    return { tier: 1, rate: 4, label: "Tier 1 (0-100 PV): 4%" };
  }
  if (totalPVSold <= 300) {
    return { tier: 2, rate: 2, label: "Tier 2 (101-300 PV): 2%" };
  }
  return { tier: 3, rate: 1, label: "Tier 3 (301+ PV): 1%" };
}

/**
 * Dapatkan rincian komisi per tier untuk total PV tertentu.
 */
export function getCommissionBreakdown(totalPVSold: number): {
  tier1PV: number;
  tier1Commission: number;
  tier2PV: number;
  tier2Commission: number;
  tier3PV: number;
  tier3Commission: number;
  totalCommission: number;
} {
  const tier1PV = Math.min(totalPVSold, 100);
  const tier2PV = Math.min(Math.max(totalPVSold - 100, 0), 200);
  const tier3PV = Math.max(totalPVSold - 300, 0);

  const tier1Commission = Math.round(tier1PV * PV_TO_RUPIAH * 0.04);
  const tier2Commission = Math.round(tier2PV * PV_TO_RUPIAH * 0.02);
  const tier3Commission = Math.round(tier3PV * PV_TO_RUPIAH * 0.01);

  return {
    tier1PV,
    tier1Commission,
    tier2PV,
    tier2Commission,
    tier3PV,
    tier3Commission,
    totalCommission: tier1Commission + tier2Commission + tier3Commission,
  };
}

/**
 * Process komisi stokis: hitung, kredit ke wallet, catat transaksi.
 *
 * @param db - Database instance
 * @param stokisProfile - Profil stokis yang menjual
 * @param pvAmount - Jumlah PV yang dijual
 * @param description - Deskripsi transaksi
 */
export async function creditStokisCommission(
  db: any,
  stokisProfile: {
    id: number;
    memberId: number;
    totalPVSold: string;
  },
  pvAmount: number,
  description: string,
): Promise<{ commission: number; newTotalPVSold: number }> {
  const previousTotalPV = Number(stokisProfile.totalPVSold);
  const commission = calculateTieredCommission(previousTotalPV, pvAmount);
  const newTotalPVSold = previousTotalPV + pvAmount;

  // Update totalPVSold dan totalCommission di stokis
  await db
    .update(stokis)
    .set({
      totalPVSold: sql`${stokis.totalPVSold} + ${pvAmount}`,
      totalCommission: sql`${stokis.totalCommission} + ${commission}`,
    })
    .where(eq(stokis.id, stokisProfile.id));

  if (commission > 0) {
    // Kredit komisi ke wallet stokis
    await db
      .update(wallets)
      .set({
        mainBalance: sql`${wallets.mainBalance} + ${commission}`,
      })
      .where(eq(wallets.memberId, stokisProfile.memberId));

    // Catat transaksi komisi
    const tierInfo = getCurrentTierInfo(newTotalPVSold);
    await db.insert(transactions).values({
      memberId: stokisProfile.memberId,
      type: "bonus_credit",
      amount: String(commission),
      description: `${description} | ${pvAmount} PV | ${tierInfo.label} | Komisi: Rp${commission.toLocaleString("id-ID")}`,
      status: "completed",
    });

    // Notifikasi
    await db.insert(notifications).values({
      memberId: stokisProfile.memberId,
      title: "Komisi Diterima",
      message: `Komisi Rp${commission.toLocaleString("id-ID")} dari penjualan ${pvAmount} PV. Total PV terjual: ${newTotalPVSold}.`,
      type: "system",
    });
  }

  return { commission, newTotalPVSold };
}
