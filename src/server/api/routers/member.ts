import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  memberProcedure,
  adminProcedure,
} from "~/server/api/trpc";
import {
  memberProfiles,
  wallets,
  binaryTree,
  referralLinks,
  user,
  notifications,
} from "~/server/db/schema";
import { registerMember } from "~/server/services/registration";

export const memberRouter = createTRPCRouter({
  /** Register as an MLM member (requires authenticated user + valid PIN) */
  register: protectedProcedure
    .input(
      z.object({
        pinCode: z.string().min(1),
        sponsorReferralCode: z.string().optional(),
        position: z.enum(["left", "right"]).optional(),
        autoPlacement: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if already registered
      const existing = await ctx.db.query.memberProfiles.findFirst({
        where: eq(memberProfiles.userId, ctx.session.user.id),
      });
      if (existing) {
        throw new Error("Anda sudah terdaftar sebagai member.");
      }

      return registerMember({
        userId: ctx.session.user.id,
        pinCode: input.pinCode,
        sponsorReferralCode: input.sponsorReferralCode,
        position: input.position,
        autoPlacement: input.autoPlacement,
      });
    }),

  /** Check if current user has a member profile */
  hasProfile: protectedProcedure.query(async ({ ctx }) => {
    const profile = await ctx.db.query.memberProfiles.findFirst({
      where: eq(memberProfiles.userId, ctx.session.user.id),
    });
    return { hasProfile: !!profile, profile };
  }),

  /** Get the current user's member profile */
  getMyProfile: memberProcedure.query(async ({ ctx }) => {
    return ctx.db.query.memberProfiles.findFirst({
      where: eq(memberProfiles.userId, ctx.session.user.id),
      with: {
        wallet: true,
        treeNode: true,
        user: true,
      },
    });
  }),

  /** Get member profile by ID (admin) */
  getById: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.memberProfiles.findFirst({
        where: eq(memberProfiles.id, input.id),
        with: {
          wallet: true,
          treeNode: true,
          user: true,
          stokisProfile: true,
        },
      });
    }),

  /** List all members (admin) */
  list: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        role: z
          .enum(["member", "stokis", "bendahara", "direktur", "admin"])
          .optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.role) {
        conditions.push(eq(memberProfiles.role, input.role));
      }
      const where =
        conditions.length > 0 ? and(...conditions) : undefined;

      const members = await ctx.db.query.memberProfiles.findMany({
        where,
        with: { user: true, wallet: true },
        limit: input.limit,
        offset: input.offset,
        orderBy: desc(memberProfiles.createdAt),
      });

      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(memberProfiles)
        .where(where);

      return {
        members,
        total: Number(countResult[0]?.count ?? 0),
      };
    }),

  /** Update member profile */
  updateProfile: memberProcedure
    .input(
      z.object({
        phone: z.string().optional(),
        address: z.string().optional(),
        bankName: z.string().optional(),
        bankAccountNumber: z.string().optional(),
        bankAccountHolder: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(memberProfiles)
        .set(input)
        .where(eq(memberProfiles.id, ctx.memberProfile.id))
        .returning();
      return updated;
    }),

  /** Enable warung mode */
  enableWarung: memberProcedure
    .input(
      z.object({
        warungName: z.string().min(1),
        warungPhoto: z.string().optional(),
        warungLat: z.string().optional(),
        warungLng: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(memberProfiles)
        .set({
          isWarung: true,
          warungName: input.warungName,
          warungPhoto: input.warungPhoto,
          warungLat: input.warungLat,
          warungLng: input.warungLng,
        })
        .where(eq(memberProfiles.id, ctx.memberProfile.id))
        .returning();
      return updated;
    }),

  /** Admin: update member role */
  updateRole: adminProcedure
    .input(
      z.object({
        memberId: z.number(),
        role: z.enum(["member", "stokis", "bendahara", "direktur", "admin"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(memberProfiles)
        .set({ role: input.role })
        .where(eq(memberProfiles.id, input.memberId))
        .returning();
      return updated;
    }),

  /** Get dashboard stats for current member */
  getDashboardStats: memberProcedure.query(async ({ ctx }) => {
    const profile = ctx.memberProfile;
    const wallet = await ctx.db.query.wallets.findFirst({
      where: eq(wallets.memberId, profile.id),
    });
    const treeNode = await ctx.db.query.binaryTree.findFirst({
      where: eq(binaryTree.memberId, profile.id),
    });

    const directRecruits = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(memberProfiles)
      .where(eq(memberProfiles.sponsorId, profile.id));

    const unreadNotifications = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.memberId, profile.id),
          eq(notifications.isRead, false),
        ),
      );

    return {
      profile,
      wallet,
      treeNode,
      directRecruitCount: Number(directRecruits[0]?.count ?? 0),
      unreadNotificationCount: Number(unreadNotifications[0]?.count ?? 0),
    };
  }),

  /** Get referral link */
  getReferralLink: memberProcedure.query(async ({ ctx }) => {
    let link = await ctx.db.query.referralLinks.findFirst({
      where: eq(referralLinks.memberId, ctx.memberProfile.id),
    });

    if (!link) {
      const [newLink] = await ctx.db
        .insert(referralLinks)
        .values({
          memberId: ctx.memberProfile.id,
          code: ctx.memberProfile.referralCode,
        })
        .returning();
      link = newLink!;
    }

    return link;
  }),

  /** Resolve referral code to sponsor info */
  resolveReferral: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ ctx, input }) => {
      const profile = await ctx.db.query.memberProfiles.findFirst({
        where: eq(memberProfiles.referralCode, input.code),
        with: { user: true },
      });

      if (!profile) return null;

      return {
        sponsorId: profile.id,
        sponsorName: profile.user.name,
        referralCode: profile.referralCode,
      };
    }),
});
