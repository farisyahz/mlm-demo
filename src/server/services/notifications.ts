import { db } from "~/server/db";
import { notifications } from "~/server/db/schema";

type NotificationType =
  | "withdrawal_request"
  | "withdrawal_approved"
  | "withdrawal_rejected"
  | "withdrawal_completed"
  | "bonus_received"
  | "rank_up"
  | "system"
  | "referral_joined";

/**
 * Send an in-app notification to a member.
 */
export async function sendNotification(params: {
  memberId: number;
  title: string;
  message: string;
  type?: NotificationType;
  soundAlert?: boolean;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await db.insert(notifications).values({
    memberId: params.memberId,
    title: params.title,
    message: params.message,
    type: params.type ?? "system",
    soundAlert: params.soundAlert ?? false,
    metadata: params.metadata ? JSON.stringify(params.metadata) : null,
  });
}

/**
 * Send notification to all members with a specific role.
 */
export async function sendNotificationToRole(
  role: "admin" | "direktur" | "bendahara" | "stokis" | "member",
  params: {
    title: string;
    message: string;
    type?: NotificationType;
    soundAlert?: boolean;
  },
): Promise<void> {
  const { memberProfiles } = await import("~/server/db/schema");
  const { eq } = await import("drizzle-orm");

  const members = await db.query.memberProfiles.findMany({
    where: eq(memberProfiles.role, role),
  });

  for (const member of members) {
    await sendNotification({
      memberId: member.id,
      ...params,
    });
  }
}
