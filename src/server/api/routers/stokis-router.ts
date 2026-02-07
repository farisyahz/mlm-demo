import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  stokisProcedure,
  memberProcedure,
} from "~/server/api/trpc";
import { stokis, pins, memberProfiles } from "~/server/db/schema";

export const stokisRouter = createTRPCRouter({
  /** Get stokis profile */
  getMyProfile: stokisProcedure.query(async ({ ctx }) => {
    return ctx.db.query.stokis.findFirst({
      where: eq(stokis.memberId, ctx.memberProfile.id),
    });
  }),

  /** Get stokis PIN stock */
  getPinStock: stokisProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        status: z.enum(["available", "used", "expired"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const stokisProfile = await ctx.db.query.stokis.findFirst({
        where: eq(stokis.memberId, ctx.memberProfile.id),
      });

      if (!stokisProfile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Stokis profile not found" });
      }

      const conditions = [eq(pins.stokisId, stokisProfile.id)];
      if (input.status) conditions.push(eq(pins.status, input.status));

      const items = await ctx.db.query.pins.findMany({
        where: and(...conditions),
        limit: input.limit,
        offset: input.offset,
        orderBy: desc(pins.createdAt),
      });

      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(pins)
        .where(and(...conditions));

      return { pins: items, total: Number(countResult[0]?.count ?? 0) };
    }),

  /** Sell a PIN to a member (used during registration) */
  sellPin: stokisProcedure
    .input(z.object({ pinId: z.number(), buyerMemberId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const pin = await ctx.db.query.pins.findFirst({
        where: and(eq(pins.id, input.pinId), eq(pins.status, "available")),
      });

      if (!pin) {
        throw new TRPCError({ code: "NOT_FOUND", message: "PIN not available" });
      }

      const [updated] = await ctx.db
        .update(pins)
        .set({
          status: "used",
          usedByMemberId: input.buyerMemberId,
          usedAt: new Date(),
        })
        .where(eq(pins.id, input.pinId))
        .returning();

      return updated;
    }),

  /** List all stokis (for member purchase flow) */
  listStokis: memberProcedure.query(async ({ ctx }) => {
    return ctx.db.query.stokis.findMany({
      where: eq(stokis.isActive, true),
      with: { member: { with: { user: true } } },
    });
  }),
});
