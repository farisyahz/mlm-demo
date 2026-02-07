import { redirect } from "next/navigation";
import { db } from "~/server/db";
import { referralLinks } from "~/server/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Referral link redirect page.
 * When someone visits /ref/{code}, we:
 * 1. Increment click count on the referral link
 * 2. Redirect to /register?ref={code}
 */
export default async function ReferralPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  // Increment click count
  await db
    .update(referralLinks)
    .set({ clickCount: sql`${referralLinks.clickCount} + 1` })
    .where(eq(referralLinks.code, code));

  redirect(`/register?ref=${code}`);
}
