"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "./logs";

// Spaces are per-restaurant, fully custom (add/rename/delete) — see the Space
// model in prisma/schema.prisma. RestaurantTable.space is a free-text column,
// not a foreign key, so renaming a space bulk-updates every table's `space`
// string in the same transaction as the Space row rename.

export async function getSpaces(restaurantId: string) {
  try {
    const spaces = await prisma.space.findMany({
      where: { restaurantId },
      orderBy: { displayOrder: "asc" },
    });

    // Table counts per space, so the UI can warn before a delete that would
    // orphan tables and can render "(N tables)" next to each space.
    const counts = await prisma.restaurantTable.groupBy({
      by: ["space"],
      where: { restaurantId },
      _count: true,
    });
    const countByName = new Map(counts.map((c) => [c.space, c._count]));

    return {
      data: spaces.map((f) => ({
        id: f.id,
        name: f.name,
        displayOrder: f.displayOrder,
        tableCount: countByName.get(f.name) ?? 0,
      })),
    };
  } catch (err: any) {
    return { error: err?.message || "Failed to load spaces" };
  }
}

export async function addSpace(restaurantId: string, name: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  const trimmed = name.trim();
  if (!trimmed) return { error: "Space name is required" };
  if (trimmed.length > 40) return { error: "Space name must be 40 characters or fewer" };

  try {
    const last = await prisma.space.findFirst({
      where: { restaurantId },
      orderBy: { displayOrder: "desc" },
      select: { displayOrder: true },
    });

    const space = await prisma.space.create({
      data: {
        restaurantId,
        name: trimmed,
        displayOrder: (last?.displayOrder ?? -1) + 1,
      },
    });

    await logActivity(session, {
      actionType: "SPACE_ADD",
      entityType: "Space",
      entityId: space.id,
      description: `Space "${name}" added`,
    });

    return { data: { id: space.id, name: space.name, displayOrder: space.displayOrder, tableCount: 0 } };
  } catch (err: any) {
    if (err?.code === "P2002") {
      return { error: `A space named "${trimmed}" already exists` };
    }
    return { error: err?.message || "Failed to add space" };
  }
}

export async function renameSpace(spaceId: string, restaurantId: string, newName: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  const trimmed = newName.trim();
  if (!trimmed) return { error: "Space name is required" };
  if (trimmed.length > 40) return { error: "Space name must be 40 characters or fewer" };

  try {
    const space = await prisma.space.findFirst({ where: { id: spaceId, restaurantId } });
    if (!space) return { error: "Space not found" };
    if (space.name === trimmed) return { data: { id: space.id, name: space.name } };

    // Rename the Space row and repoint every table on it in one transaction —
    // otherwise a crash mid-way would leave tables pointing at a name no
    // Space row has, silently hiding them from the tab list.
    const [updatedSpace] = await prisma.$transaction([
      prisma.space.update({ where: { id: spaceId }, data: { name: trimmed } }),
      prisma.restaurantTable.updateMany({
        where: { restaurantId, space: space.name },
        data: { space: trimmed },
      }),
    ]);

    await logActivity(session, {
      actionType: "SPACE_RENAME",
      entityType: "Space",
      entityId: spaceId,
      description: `Space renamed to "${newName}"`,
    });

    return { data: { id: updatedSpace.id, name: updatedSpace.name } };
  } catch (err: any) {
    if (err?.code === "P2002") {
      return { error: `A space named "${trimmed}" already exists` };
    }
    return { error: err?.message || "Failed to rename space" };
  }
}

export async function deleteSpace(spaceId: string, restaurantId: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    const space = await prisma.space.findFirst({ where: { id: spaceId, restaurantId } });
    if (!space) return { error: "Space not found" };

    const remaining = await prisma.space.count({ where: { restaurantId } });
    if (remaining <= 1) return { error: "You must keep at least one space" };

    const tableCount = await prisma.restaurantTable.count({ where: { restaurantId, space: space.name } });
    if (tableCount > 0) {
      return { error: `Move or delete the ${tableCount} table${tableCount === 1 ? "" : "s"} on "${space.name}" before deleting it` };
    }

    await prisma.space.delete({ where: { id: spaceId } });

    await logActivity(session, {
      actionType: "SPACE_DELETE",
      entityType: "Space",
      entityId: spaceId,
      description: `Space deleted`,
    });

    return { data: { id: spaceId } };
  } catch (err: any) {
    return { error: err?.message || "Failed to delete space" };
  }
}
