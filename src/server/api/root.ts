import { postRouter } from "~/server/api/routers/post";
import { memberRouter } from "~/server/api/routers/member";
import { treeRouter } from "~/server/api/routers/tree";
import { walletRouter } from "~/server/api/routers/wallet";
import { withdrawalRouter } from "~/server/api/routers/withdrawal";
import { adminRouter } from "~/server/api/routers/admin";
import { bonusRouter } from "~/server/api/routers/bonus";
import { stokisRouter } from "~/server/api/routers/stokis-router";
import { productRouter } from "~/server/api/routers/product";
import { notificationRouter } from "~/server/api/routers/notification";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  member: memberRouter,
  tree: treeRouter,
  wallet: walletRouter,
  withdrawal: withdrawalRouter,
  admin: adminRouter,
  bonus: bonusRouter,
  stokis: stokisRouter,
  product: productRouter,
  notification: notificationRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
