import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  memberProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { products, memberProfiles } from "~/server/db/schema";

export const productRouter = createTRPCRouter({
  /** List active and approved products (public) */
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        category: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [
        eq(products.isActive, true),
        eq(products.approvalStatus, "approved"),
      ];
      if (input.category)
        conditions.push(eq(products.category, input.category));

      const items = await ctx.db.query.products.findMany({
        where: and(...conditions),
        with: { warung: { with: { user: true } } },
        limit: input.limit,
        offset: input.offset,
        orderBy: desc(products.createdAt),
      });

      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(and(...conditions));

      return { products: items, total: Number(countResult[0]?.count ?? 0) };
    }),

  /** Create a product (warung member) */
  create: memberProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        price: z.number().positive(),
        pvValue: z.number().positive(),
        imageUrl: z.string().optional(),
        category: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.memberProfile.isWarung) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Anda harus mengaktifkan mode warung terlebih dahulu.",
        });
      }

      // Validate PV ratio: 1 PV = Rp1.000, PV cannot exceed price/1000
      const maxPV = input.price / 1000;
      if (input.pvValue > maxPV) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Nilai PV tidak boleh melebihi ${maxPV} (rasio 1 PV = Rp1.000). Harga Rp${input.price.toLocaleString("id-ID")} maksimal ${maxPV} PV.`,
        });
      }

      const [created] = await ctx.db
        .insert(products)
        .values({
          warungMemberId: ctx.memberProfile.id,
          name: input.name,
          description: input.description,
          price: String(input.price),
          pvValue: String(input.pvValue),
          imageUrl: input.imageUrl,
          category: input.category,
          approvalStatus: "pending",
        })
        .returning();

      return created;
    }),

  /** Update a product */
  update: memberProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        price: z.number().positive().optional(),
        pvValue: z.number().positive().optional(),
        imageUrl: z.string().optional(),
        category: z.string().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.db.query.products.findFirst({
        where: and(
          eq(products.id, input.id),
          eq(products.warungMemberId, ctx.memberProfile.id),
        ),
      });

      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Validate PV ratio if both price and pvValue are updated
      const effectivePrice = input.price ?? Number(product.price);
      const effectivePV = input.pvValue ?? Number(product.pvValue);
      const maxPV = effectivePrice / 1000;
      if (effectivePV > maxPV) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Nilai PV tidak boleh melebihi ${maxPV} (rasio 1 PV = Rp1.000).`,
        });
      }

      const { id, ...updateData } = input;
      const setData: Record<string, unknown> = {};
      if (updateData.name) setData.name = updateData.name;
      if (updateData.description !== undefined) setData.description = updateData.description;
      if (updateData.price) setData.price = String(updateData.price);
      if (updateData.pvValue) setData.pvValue = String(updateData.pvValue);
      if (updateData.imageUrl !== undefined) setData.imageUrl = updateData.imageUrl;
      if (updateData.category !== undefined) setData.category = updateData.category;
      if (updateData.isActive !== undefined) setData.isActive = updateData.isActive;

      const [updated] = await ctx.db
        .update(products)
        .set(setData)
        .where(eq(products.id, input.id))
        .returning();

      return updated;
    }),

  /** Get my products (warung) */
  getMyProducts: memberProcedure.query(async ({ ctx }) => {
    return ctx.db.query.products.findMany({
      where: eq(products.warungMemberId, ctx.memberProfile.id),
      orderBy: desc(products.createdAt),
    });
  }),

  /** Delete a product */
  delete: memberProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.db.query.products.findFirst({
        where: and(
          eq(products.id, input.id),
          eq(products.warungMemberId, ctx.memberProfile.id),
        ),
      });

      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Soft delete
      const [updated] = await ctx.db
        .update(products)
        .set({ isActive: false })
        .where(eq(products.id, input.id))
        .returning();

      return updated;
    }),
});
