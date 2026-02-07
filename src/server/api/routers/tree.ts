import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import {
  createTRPCRouter,
  memberProcedure,
  adminProcedure,
} from "~/server/api/trpc";
import { binaryTree, memberProfiles } from "~/server/db/schema";

export const treeRouter = createTRPCRouter({
  /** Get the binary tree rooted at the current member */
  getMyTree: memberProcedure
    .input(z.object({ depth: z.number().min(1).max(10).default(5) }))
    .query(async ({ ctx, input }) => {
      const rootNode = await ctx.db.query.binaryTree.findFirst({
        where: eq(binaryTree.memberId, ctx.memberProfile.id),
        with: { member: { with: { user: true } } },
      });

      if (!rootNode) return null;

      // Recursively fetch tree to requested depth
      const tree = await fetchTreeNode(ctx.db, rootNode.id, input.depth);
      return tree;
    }),

  /** Get tree from a specific node (admin) */
  getTreeFromNode: adminProcedure
    .input(
      z.object({
        nodeId: z.number(),
        depth: z.number().min(1).max(10).default(5),
      }),
    )
    .query(async ({ ctx, input }) => {
      return fetchTreeNode(ctx.db, input.nodeId, input.depth);
    }),

  /** Get direct children of a node */
  getChildren: memberProcedure
    .input(z.object({ nodeId: z.number() }))
    .query(async ({ ctx, input }) => {
      const node = await ctx.db.query.binaryTree.findFirst({
        where: eq(binaryTree.id, input.nodeId),
      });
      if (!node) return { left: null, right: null };

      const leftChild = node.leftChildId
        ? await ctx.db.query.binaryTree.findFirst({
            where: eq(binaryTree.id, node.leftChildId),
            with: { member: { with: { user: true } } },
          })
        : null;

      const rightChild = node.rightChildId
        ? await ctx.db.query.binaryTree.findFirst({
            where: eq(binaryTree.id, node.rightChildId),
            with: { member: { with: { user: true } } },
          })
        : null;

      return { left: leftChild, right: rightChild };
    }),

  /** Get network stats for current member */
  getNetworkStats: memberProcedure.query(async ({ ctx }) => {
    const node = await ctx.db.query.binaryTree.findFirst({
      where: eq(binaryTree.memberId, ctx.memberProfile.id),
    });

    if (!node) {
      return {
        leftGroupPV: "0",
        rightGroupPV: "0",
        leftGroupHU: 0,
        rightGroupHU: 0,
        totalGroupHU: 0,
        depth: 0,
      };
    }

    return {
      leftGroupPV: node.leftGroupPV,
      rightGroupPV: node.rightGroupPV,
      leftGroupHU: node.leftGroupHU,
      rightGroupHU: node.rightGroupHU,
      totalGroupHU: node.leftGroupHU + node.rightGroupHU,
      depth: node.depth,
    };
  }),
});

// Helper: recursively fetch tree nodes to a given depth
interface TreeNodeResult {
  id: number;
  memberId: number;
  position: string | null;
  leftGroupPV: string;
  rightGroupPV: string;
  leftGroupHU: number;
  rightGroupHU: number;
  depth: number;
  member: {
    id: number;
    referralCode: string;
    rank: string;
    personalPV: string;
    accumulatedPV: string;
    isActive: boolean;
    user: { name: string; email: string; image: string | null };
  } | null;
  left: TreeNodeResult | null;
  right: TreeNodeResult | null;
}

async function fetchTreeNode(
  db: any,
  nodeId: number,
  depth: number,
): Promise<TreeNodeResult | null> {
  if (depth <= 0) return null;

  const node = await db.query.binaryTree.findFirst({
    where: eq(binaryTree.id, nodeId),
    with: {
      member: {
        with: { user: true },
      },
    },
  });

  if (!node) return null;

  const left = node.leftChildId
    ? await fetchTreeNode(db, node.leftChildId, depth - 1)
    : null;

  const right = node.rightChildId
    ? await fetchTreeNode(db, node.rightChildId, depth - 1)
    : null;

  return {
    id: node.id,
    memberId: node.memberId,
    position: node.position,
    leftGroupPV: node.leftGroupPV,
    rightGroupPV: node.rightGroupPV,
    leftGroupHU: node.leftGroupHU,
    rightGroupHU: node.rightGroupHU,
    depth: node.depth,
    member: node.member
      ? {
          id: node.member.id,
          referralCode: node.member.referralCode,
          rank: node.member.rank,
          personalPV: node.member.personalPV,
          accumulatedPV: node.member.accumulatedPV,
          isActive: node.member.isActive,
          user: {
            name: node.member.user.name,
            email: node.member.user.email,
            image: node.member.user.image,
          },
        }
      : null,
    left,
    right,
  };
}
