import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { withdrawals, notifications } from "~/server/db/schema";
import { env } from "~/env";

/**
 * Xendit webhook handler.
 * Receives disbursement status updates.
 */
export async function POST(req: NextRequest) {
  try {
    // Verify webhook token
    const webhookToken = req.headers.get("x-callback-token");
    if (env.XENDIT_WEBHOOK_TOKEN && webhookToken !== env.XENDIT_WEBHOOK_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { external_id, status, id } = body;

    if (!external_id) {
      return NextResponse.json(
        { error: "Missing external_id" },
        { status: 400 },
      );
    }

    // Find the withdrawal by ID (external_id = withdrawal ID)
    const withdrawalId = parseInt(external_id, 10);
    if (isNaN(withdrawalId)) {
      return NextResponse.json(
        { error: "Invalid external_id" },
        { status: 400 },
      );
    }

    const withdrawal = await db.query.withdrawals.findFirst({
      where: eq(withdrawals.id, withdrawalId),
    });

    if (!withdrawal) {
      return NextResponse.json(
        { error: "Withdrawal not found" },
        { status: 404 },
      );
    }

    // Update based on status
    if (status === "COMPLETED" || status === "SUCCEEDED") {
      await db
        .update(withdrawals)
        .set({
          status: "completed",
          completedAt: new Date(),
          xenditDisbursementId: id,
        })
        .where(eq(withdrawals.id, withdrawalId));

      await db.insert(notifications).values({
        memberId: withdrawal.memberId,
        title: "Dana Telah Ditransfer",
        message: `Penarikan Rp${Number(withdrawal.amount).toLocaleString("id-ID")} telah berhasil ditransfer ke rekening Anda.`,
        type: "withdrawal_completed",
        soundAlert: true,
      });
    } else if (status === "FAILED") {
      // Handle failed disbursement - refund to wallet
      await db
        .update(withdrawals)
        .set({
          status: "rejected",
          rejectionReason: "Disbursement failed",
          xenditDisbursementId: id,
        })
        .where(eq(withdrawals.id, withdrawalId));

      await db.insert(notifications).values({
        memberId: withdrawal.memberId,
        title: "Transfer Gagal",
        message: `Penarikan Rp${Number(withdrawal.amount).toLocaleString("id-ID")} gagal. Dana dikembalikan ke saldo Anda.`,
        type: "withdrawal_rejected",
        soundAlert: true,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Xendit Webhook] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
