import { NextRequest, NextResponse } from "next/server";
import { calculatePairingBonuses } from "~/server/services/bonuses/pairing-bonus";
import { calculatePlanBBonuses } from "~/server/services/bonuses/plan-b";
import {
  processRankUpgrades,
  calculatePlanCBonuses,
} from "~/server/services/bonuses/plan-cd";

/**
 * Daily Bonus Calculation.
 * Scheduled via QStash: every day at 00:00 WIB.
 * Cron: 0 17 * * * (UTC 17:00 = WIB 00:00)
 *
 * 1. Calculate pairing bonuses (includes matching bonus)
 * 2. Calculate Plan B titik bonuses
 * 3. Calculate Plan C komunitas bonuses
 * 4. Process rank upgrades and plan activations
 */
export async function POST(req: NextRequest) {
  try {
    // TODO: Add QStash signature verification

    // 1. Pairing bonuses (triggers matching bonus internally)
    const pairingResult = await calculatePairingBonuses();
    console.log("[BonusCalc] Pairing result:", pairingResult);

    // 2. Plan B titik bonuses
    const planBResult = await calculatePlanBBonuses();
    console.log("[BonusCalc] Plan B result:", planBResult);

    // 3. Plan C komunitas bonuses
    const planCResult = await calculatePlanCBonuses();
    console.log("[BonusCalc] Plan C result:", planCResult);

    // 4. Rank upgrades + Plan C/D activation
    const rankResult = await processRankUpgrades();
    console.log("[BonusCalc] Rank result:", rankResult);

    return NextResponse.json({
      success: true,
      pairing: pairingResult,
      planB: planBResult,
      planC: planCResult,
      ranks: rankResult,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[BonusCalc] Error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}
