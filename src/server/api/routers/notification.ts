import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";
import {
  createTRPCRouter,
  memberProcedure,
} from "~/server/api/trpc";
import { notifications } from "~/server/db/schema";

export const notificationRouter = createTRPCRouter({
  /** Get notifications for current member */
  list: memberProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        unreadOnly: z.boolean().default(false),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [
        eq(notifications.memberId, ctx.memberProfile.id),
      ];
      if (input.unreadOnly) {
        conditions.push(eq(notifications.isRead, false));
      }

      const items = await ctx.db.query.notifications.findMany({
        where: and(...conditions),
        limit: input.limit,
        offset: input.offset,
        orderBy: desc(notifications.createdAt),
      });

      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(and(...conditions));

      return {
        notifications: items,
        total: Number(countResult[0]?.count ?? 0),
      };
    }),

  /** Mark notification as read */
  markRead: memberProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.id, input.id),
            eq(notifications.memberId, ctx.memberProfile.id),
          ),
        );
      return { success: true };
    }),

  /** Mark all as read */
  markAllRead: memberProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.memberId, ctx.memberProfile.id),
          eq(notifications.isRead, false),
        ),
      );
    return { success: true };
  }),

  /** Get unread count */
  unreadCount: memberProcedure.query(async ({ ctx }) => {
    const result = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.memberId, ctx.memberProfile.id),
          eq(notifications.isRead, false),
        ),
      );
    return { count: Number(result[0]?.count ?? 0) };
  }),
});
