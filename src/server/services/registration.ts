import { eq, and, sql } from "drizzle-orm";
import { db } from "~/server/db";
import {
  memberProfiles,
  pins,
  wallets,
  binaryTree,
  referralLinks,
  transactions,
  nationalTurnover,
  notifications,
} from "~/server/db/schema";
import { placeInTree, autoPlace } from "~/server/services/binary-tree";
import { calculateSponsorBonus } from "~/server/services/bonuses/sponsor-bonus";
import { calculatePersonalBonus } from "~/server/services/bonuses/personal-bonus";
import { addToNationalTurnover } from "~/server/services/wallet";
import { propagatePVUp } from "~/server/services/binary-tree";
import { nanoid } from "~/lib/nanoid";

interface RegisterMemberParams {
  userId: string;
  pinCode: string;
  sponsorReferralCode?: string;
  position?: "left" | "right";
  autoPlacement?: boolean;
}

interface RegisterMemberResult {
  memberId: number;
  referralCode: string;
  walletId: number;
  treeNodeId: number;
}

/**
 * Complete MLM member registration after user account creation.
 *
 * 1. Validate and consume the registration PIN
 * 2. Create member profile with sponsor link
 * 3. Create wallet
 * 4. Place in binary tree
 * 5. Credit initial PV
 * 6. Trigger sponsor bonus
 * 7. Update national turnover
 */
export async function registerMember(
  params: RegisterMemberParams,
): Promise<RegisterMemberResult> {
  const { userId, pinCode, sponsorReferralCode, position, autoPlacement } =
    params;

  // 1. Validate PIN
  const pin = await db.query.pins.findFirst({
    where: and(eq(pins.pin, pinCode), eq(pins.status, "available")),
  });

  if (!pin) {
    throw new Error("PIN tidak valid atau sudah digunakan.");
  }

  // 2. Find sponsor
  let sponsorId: number | null = null;
  if (sponsorReferralCode) {
    const sponsor = await db.query.memberProfiles.findFirst({
      where: eq(memberProfiles.referralCode, sponsorReferralCode),
    });
    if (!sponsor) {
      throw new Error("Kode referral sponsor tidak ditemukan.");
    }
    sponsorId = sponsor.id;
  }

  // 3. Generate unique referral code
  const referralCode = nanoid(8).toUpperCase();

  // 4. Create member profile
  const pvValue = Number(pin.pvValue);
  const [profile] = await db
    .insert(memberProfiles)
    .values({
      userId,
      referralCode,
      sponsorId,
      role: "member",
      personalPV: pin.pvValue,
      accumulatedPV: pin.pvValue,
      joinPackage: 1,
      pinCount: 1,
    })
    .returning();

  // 5. Mark PIN as used
  await db
    .update(pins)
    .set({
      status: "used",
      usedByMemberId: profile!.id,
      usedAt: new Date(),
    })
    .where(eq(pins.id, pin.id));

  // 6. Create wallet
  const [wallet] = await db
    .insert(wallets)
    .values({ memberId: profile!.id })
    .returning();

  // 7. Create referral link
  await db.insert(referralLinks).values({
    memberId: profile!.id,
    code: referralCode,
  });

  // 8. Place in binary tree
  let treeNode;
  if (sponsorId) {
    // Ensure sponsor has a tree node
    const sponsorNode = await db.query.binaryTree.findFirst({
      where: eq(binaryTree.memberId, sponsorId),
    });
    if (!sponsorNode) {
      // Create root for sponsor if needed
      await db.insert(binaryTree).values({
        memberId: sponsorId,
        parentId: null,
        position: null,
        depth: 0,
      });
    }

    if (autoPlacement) {
      treeNode = await autoPlace(profile!.id, sponsorId);
    } else {
      treeNode = await placeInTree(profile!.id, sponsorId, position);
    }
  } else {
    // First member (root of tree)
    const [rootNode] = await db
      .insert(binaryTree)
      .values({
        memberId: profile!.id,
        parentId: null,
        position: null,
        depth: 0,
      })
      .returning();
    treeNode = rootNode!;
  }

  // 9. Record registration transaction
  await db.insert(transactions).values({
    memberId: profile!.id,
    type: "registration",
    amount: pin.price,
    pvAmount: pin.pvValue,
    description: `Registrasi member dengan PIN ${pin.pin}`,
    status: "completed",
  });

  // 10. Add to national turnover
  await addToNationalTurnover(pvValue);

  // 11. Propagate PV up the tree
  await propagatePVUp(profile!.id, pvValue);

  // 12. Calculate bonuses
  if (sponsorId) {
    await calculateSponsorBonus(profile!.id, pvValue);

    // Notify sponsor
    const sponsor = await db.query.memberProfiles.findFirst({
      where: eq(memberProfiles.id, sponsorId),
      with: { user: true },
    });

    await db.insert(notifications).values({
      memberId: sponsorId,
      title: "Member Baru Bergabung!",
      message: `Member baru telah bergabung melalui link referral Anda.`,
      type: "referral_joined",
      soundAlert: true,
    });

    // Update sponsor's referral link counter
    if (sponsorReferralCode) {
      await db
        .update(referralLinks)
        .set({
          registrationCount: sql`${referralLinks.registrationCount} + 1`,
        })
        .where(eq(referralLinks.code, sponsorReferralCode));
    }
  }

  // 13. Calculate personal bonus
  await calculatePersonalBonus(profile!.id, pvValue);

  return {
    memberId: profile!.id,
    referralCode,
    walletId: wallet!.id,
    treeNodeId: treeNode.id,
  };
}
