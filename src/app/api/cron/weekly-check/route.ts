import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "~/server/db";
import { memberProfiles } from "~/server/db/schema";

/**
 * Weekly Repurchase Check.
 * Scheduled via QStash: every Sunday at 00:00 WIB.
 * Cron: 0 17 * * 0 (UTC 17:00 Sunday = WIB 00:00 Monday)
 *
 * Checks if members met the minimum 15 PV weekly repurchase requirement.
 * Resets weeklyRepurchasePV for the new week.
 */
export async function POST(req: NextRequest) {
  try {
    // TODO: Add QStash signature verification

    // Get all active members
    const members = await db.query.memberProfiles.findMany({
      where: eq(memberProfiles.isActive, true),
    });

    let metRequirement = 0;
    let failedRequirement = 0;

    for (const member of members) {
      const weeklyPV = Number(member.weeklyRepurchasePV);

      if (weeklyPV >= 15) {
        metRequirement++;
      } else {
        failedRequirement++;
        // Members who fail the weekly requirement are noted
        // (SHU bonus eligibility is checked during settlement)
      }
    }

    // Reset weekly repurchase PV for all members
    await db
      .update(memberProfiles)
      .set({
        weeklyRepurchasePV: "0",
        lastRepurchaseAt: new Date(),
      })
      .where(eq(memberProfiles.isActive, true));

    return NextResponse.json({
      success: true,
      metRequirement,
      failedRequirement,
      totalChecked: members.length,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[WeeklyCheck] Error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}
