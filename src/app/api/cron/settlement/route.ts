import { NextRequest, NextResponse } from "next/server";
import { settleSHU } from "~/server/services/bonuses/shu-bonus";
import { distributeSeracoinBonuses } from "~/server/services/bonuses/seracoin-bonus";

// Bi-weekly SHU Settlement.
// Scheduled via QStash: every 2 weeks on Saturday at 00:00 WIB.
// Cron: "0 17 1,15 * *" (UTC 17:00 on 1st and 15th = WIB 00:00)
//
// 1. Settles SHU bonuses
// 2. Distributes SERACOIN bonuses
// 3. Resets national turnover for new period
export async function POST(req: NextRequest) {
  try {
    // Verify QStash signature in production
    // TODO: Add QStash signature verification

    const now = new Date();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // 1. Settle SHU
    const shuResult = await settleSHU(twoWeeksAgo, now);
    console.log("[Settlement] SHU result:", shuResult);

    // 2. Distribute SERACOIN
    const coinResult = await distributeSeracoinBonuses(twoWeeksAgo);
    console.log("[Settlement] SERACOIN result:", coinResult);

    return NextResponse.json({
      success: true,
      shu: shuResult,
      seracoin: coinResult,
      settledAt: now.toISOString(),
    });
  } catch (error) {
    console.error("[Settlement] Error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}
