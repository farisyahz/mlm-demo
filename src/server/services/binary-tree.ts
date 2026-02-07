import { eq, sql, and, isNull } from "drizzle-orm";
import { db } from "~/server/db";
import { binaryTree, memberProfiles } from "~/server/db/schema";

/**
 * Place a new member in the binary tree.
 * If position is specified, places at that position under sponsor.
 * If not specified (auto), places on the side with fewer members (auto-balance).
 */
export async function placeInTree(
  memberId: number,
  sponsorId: number,
  position?: "left" | "right",
): Promise<typeof binaryTree.$inferSelect> {
  // Find sponsor's tree node
  const sponsorNode = await db.query.binaryTree.findFirst({
    where: eq(binaryTree.memberId, sponsorId),
  });

  // If sponsor has no tree node (first ever member), create root
  if (!sponsorNode) {
    const [root] = await db
      .insert(binaryTree)
      .values({
        memberId: sponsorId,
        parentId: null,
        position: null,
        depth: 0,
      })
      .returning();

    // Now place the new member under root
    return placeUnderNode(memberId, root!.id, position);
  }

  // Find where to place: either directly under sponsor or find next available slot
  return placeUnderNode(memberId, sponsorNode.id, position);
}

/**
 * Place a member under a specific node.
 * Finds the next available slot using BFS if the specified position is taken.
 */
async function placeUnderNode(
  memberId: number,
  parentNodeId: number,
  preferredPosition?: "left" | "right",
): Promise<typeof binaryTree.$inferSelect> {
  const parentNode = await db.query.binaryTree.findFirst({
    where: eq(binaryTree.id, parentNodeId),
  });

  if (!parentNode) {
    throw new Error("Parent node not found");
  }

  // Check if preferred position is available directly under parent
  if (preferredPosition === "left" && !parentNode.leftChildId) {
    return createChildNode(memberId, parentNode, "left");
  }
  if (preferredPosition === "right" && !parentNode.rightChildId) {
    return createChildNode(memberId, parentNode, "right");
  }

  // If both slots are open, prefer the specified side or left by default
  if (!parentNode.leftChildId && !parentNode.rightChildId) {
    const side = preferredPosition ?? "left";
    return createChildNode(memberId, parentNode, side);
  }

  // If only one slot is open, use it
  if (!parentNode.leftChildId) {
    return createChildNode(memberId, parentNode, "left");
  }
  if (!parentNode.rightChildId) {
    return createChildNode(memberId, parentNode, "right");
  }

  // Both slots taken, find next available using BFS (spillover)
  const targetNode = await findNextAvailableSlot(parentNodeId, preferredPosition);
  if (!targetNode) {
    throw new Error("No available slot in tree");
  }

  return createChildNode(
    memberId,
    targetNode.node,
    targetNode.position,
  );
}

/**
 * Create a child node in the binary tree.
 */
async function createChildNode(
  memberId: number,
  parentNode: typeof binaryTree.$inferSelect,
  position: "left" | "right",
): Promise<typeof binaryTree.$inferSelect> {
  const [newNode] = await db
    .insert(binaryTree)
    .values({
      memberId,
      parentId: parentNode.id,
      position,
      depth: parentNode.depth + 1,
    })
    .returning();

  // Update parent's child reference
  if (position === "left") {
    await db
      .update(binaryTree)
      .set({ leftChildId: newNode!.id })
      .where(eq(binaryTree.id, parentNode.id));
  } else {
    await db
      .update(binaryTree)
      .set({ rightChildId: newNode!.id })
      .where(eq(binaryTree.id, parentNode.id));
  }

  // Propagate HU count up the tree
  await propagateHUUp(parentNode.id, position);

  return newNode!;
}

/**
 * BFS to find next available slot in the tree.
 */
async function findNextAvailableSlot(
  startNodeId: number,
  preferredSide?: "left" | "right",
): Promise<{
  node: typeof binaryTree.$inferSelect;
  position: "left" | "right";
} | null> {
  const queue: number[] = [];

  // Start BFS from the preferred side
  const startNode = await db.query.binaryTree.findFirst({
    where: eq(binaryTree.id, startNodeId),
  });
  if (!startNode) return null;

  // Add children in preferred order
  if (preferredSide === "right") {
    if (startNode.rightChildId) queue.push(startNode.rightChildId);
    if (startNode.leftChildId) queue.push(startNode.leftChildId);
  } else {
    if (startNode.leftChildId) queue.push(startNode.leftChildId);
    if (startNode.rightChildId) queue.push(startNode.rightChildId);
  }

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const node = await db.query.binaryTree.findFirst({
      where: eq(binaryTree.id, nodeId),
    });

    if (!node) continue;

    if (!node.leftChildId) return { node, position: "left" };
    if (!node.rightChildId) return { node, position: "right" };

    queue.push(node.leftChildId);
    queue.push(node.rightChildId);
  }

  return null;
}

/**
 * Auto-place: places on the side with fewer HU for the sponsor's node.
 */
export async function autoPlace(
  memberId: number,
  sponsorId: number,
): Promise<typeof binaryTree.$inferSelect> {
  const sponsorNode = await db.query.binaryTree.findFirst({
    where: eq(binaryTree.memberId, sponsorId),
  });

  if (!sponsorNode) {
    // Create root for sponsor first
    return placeInTree(memberId, sponsorId);
  }

  // Place on the side with fewer members
  const side = sponsorNode.leftGroupHU <= sponsorNode.rightGroupHU ? "left" : "right";
  return placeInTree(memberId, sponsorId, side);
}

/**
 * Propagate HU (Head Unit) count up the tree when a new member is added.
 */
async function propagateHUUp(
  nodeId: number,
  childSide: "left" | "right",
): Promise<void> {
  let currentId: number | null = nodeId;

  // Walk up the tree from the parent, incrementing HU on the correct side
  while (currentId !== null) {
    const node: Awaited<ReturnType<typeof db.query.binaryTree.findFirst>> = await db.query.binaryTree.findFirst({
      where: eq(binaryTree.id, currentId),
    });
    if (!node) break;

    // The first node is the direct parent - increment based on childSide
    if (currentId === nodeId) {
      if (childSide === "left") {
        await db
          .update(binaryTree)
          .set({ leftGroupHU: sql`${binaryTree.leftGroupHU} + 1` })
          .where(eq(binaryTree.id, currentId));
      } else {
        await db
          .update(binaryTree)
          .set({ rightGroupHU: sql`${binaryTree.rightGroupHU} + 1` })
          .where(eq(binaryTree.id, currentId));
      }
    } else {
      // For ancestors, determine which side by checking the path
      if (node.leftChildId !== null) {
        // Check if the previous node was on left or right
        const prevNode = await db.query.binaryTree.findFirst({
          where: eq(binaryTree.parentId, currentId),
        });
      }
      // Simpler approach: use the position of the child that leads to us
      if (node.parentId !== null) {
        const parent: typeof node | undefined = await db.query.binaryTree.findFirst({
          where: eq(binaryTree.id, node.parentId),
        });
        if (parent) {
          if (parent.leftChildId === currentId) {
            await db
              .update(binaryTree)
              .set({ leftGroupHU: sql`${binaryTree.leftGroupHU} + 1` })
              .where(eq(binaryTree.id, parent.id));
          } else if (parent.rightChildId === currentId) {
            await db
              .update(binaryTree)
              .set({ rightGroupHU: sql`${binaryTree.rightGroupHU} + 1` })
              .where(eq(binaryTree.id, parent.id));
          }
        }
      }
    }

    currentId = node.parentId;
  }
}

/**
 * Propagate PV up the tree when a member makes a purchase.
 */
export async function propagatePVUp(
  memberId: number,
  pvAmount: number,
): Promise<void> {
  const memberNode = await db.query.binaryTree.findFirst({
    where: eq(binaryTree.memberId, memberId),
  });
  if (!memberNode || !memberNode.parentId) return;

  let currentId: number | null = memberNode.id;
  let parentId: number | null = memberNode.parentId;

  while (parentId !== null) {
    const parent: Awaited<ReturnType<typeof db.query.binaryTree.findFirst>> = await db.query.binaryTree.findFirst({
      where: eq(binaryTree.id, parentId),
    });
    if (!parent) break;

    if (parent.leftChildId === currentId) {
      await db
        .update(binaryTree)
        .set({
          leftGroupPV: sql`${binaryTree.leftGroupPV} + ${pvAmount}`,
        })
        .where(eq(binaryTree.id, parentId));
    } else if (parent.rightChildId === currentId) {
      await db
        .update(binaryTree)
        .set({
          rightGroupPV: sql`${binaryTree.rightGroupPV} + ${pvAmount}`,
        })
        .where(eq(binaryTree.id, parentId));
    }

    currentId = parentId;
    parentId = parent.parentId;
  }
}

/**
 * Count active members (HU) on a specific side of a node.
 */
export async function countGroupHU(
  nodeId: number,
  side: "left" | "right",
): Promise<number> {
  const node = await db.query.binaryTree.findFirst({
    where: eq(binaryTree.id, nodeId),
  });
  if (!node) return 0;
  return side === "left" ? node.leftGroupHU : node.rightGroupHU;
}

/**
 * Get the tree structure starting from a node, up to a given depth.
 */
export async function getTree(
  memberId: number,
  depth: number = 5,
): Promise<any> {
  const rootNode = await db.query.binaryTree.findFirst({
    where: eq(binaryTree.memberId, memberId),
  });
  if (!rootNode) return null;

  return fetchTreeRecursive(rootNode.id, depth);
}

async function fetchTreeRecursive(
  nodeId: number,
  depth: number,
): Promise<any> {
  if (depth <= 0) return null;

  const node = await db.query.binaryTree.findFirst({
    where: eq(binaryTree.id, nodeId),
    with: {
      member: { with: { user: true } },
    },
  });
  if (!node) return null;

  const left = node.leftChildId
    ? await fetchTreeRecursive(node.leftChildId, depth - 1)
    : null;
  const right = node.rightChildId
    ? await fetchTreeRecursive(node.rightChildId, depth - 1)
    : null;

  return { ...node, left, right };
}
