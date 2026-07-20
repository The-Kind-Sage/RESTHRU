"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "./logs";

// Floors are per-restaurant, fully custom (add/rename/delete) — see the Floor
// model in prisma/schema.prisma. RestaurantTable.floor is a free-text column,
// not a foreign key, so renaming a floor bulk-updates every table's `floor`
// string in the same transaction as the Floor row rename.

export async function getFloors(restaurantId: string) {
  try {
    const floors = await prisma.floor.findMany({
      where: { restaurantId },
      orderBy: { displayOrder: "asc" },
    });

    // Table counts per floor, so the UI can warn before a delete that would
    // orphan tables and can render "(N tables)" next to each floor.
    const counts = await prisma.restaurantTable.groupBy({
      by: ["floor"],
      where: { restaurantId },
      _count: true,
    });
    const countByName = new Map(counts.map((c) => [c.floor, c._count]));

    return {
      data: floors.map((f) => ({
        id: f.id,
        name: f.name,
        displayOrder: f.displayOrder,
        tableCount: countByName.get(f.name) ?? 0,
      })),
    };
  } catch (err: any) {
    return { error: err?.message || "Failed to load floors" };
  }
}

export async function addFloor(restaurantId: string, name: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  const trimmed = name.trim();
  if (!trimmed) return { error: "Floor name is required" };
  if (trimmed.length > 40) return { error: "Floor name must be 40 characters or fewer" };

  try {
    const last = await prisma.floor.findFirst({
      where: { restaurantId },
      orderBy: { displayOrder: "desc" },
      select: { displayOrder: true },
    });

    const floor = await prisma.floor.create({
      data: {
        restaurantId,
        name: trimmed,
        displayOrder: (last?.displayOrder ?? -1) + 1,
      },
    });

    await logActivity(session, {
      actionType: "FLOOR_ADD",
      entityType: "Floor",
      entityId: floor.id,
      description: `Floor "${name}" added`,
    });

    return { data: { id: floor.id, name: floor.name, displayOrder: floor.displayOrder, tableCount: 0 } };
  } catch (err: any) {
    if (err?.code === "P2002") {
      return { error: `A floor named "${trimmed}" already exists` };
    }
    return { error: err?.message || "Failed to add floor" };
  }
}

export async function renameFloor(floorId: string, restaurantId: string, newName: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  const trimmed = newName.trim();
  if (!trimmed) return { error: "Floor name is required" };
  if (trimmed.length > 40) return { error: "Floor name must be 40 characters or fewer" };

  try {
    const floor = await prisma.floor.findFirst({ where: { id: floorId, restaurantId } });
    if (!floor) return { error: "Floor not found" };
    if (floor.name === trimmed) return { data: { id: floor.id, name: floor.name } };

    // Rename the Floor row and repoint every table on it in one transaction —
    // otherwise a crash mid-way would leave tables pointing at a name no
    // Floor row has, silently hiding them from the tab list.
    const [updatedFloor] = await prisma.$transaction([
      prisma.floor.update({ where: { id: floorId }, data: { name: trimmed } }),
      prisma.restaurantTable.updateMany({
        where: { restaurantId, floor: floor.name },
        data: { floor: trimmed },
      }),
    ]);

    await logActivity(session, {
      actionType: "FLOOR_RENAME",
      entityType: "Floor",
      entityId: floorId,
      description: `Floor renamed to "${newName}"`,
    });

    return { data: { id: updatedFloor.id, name: updatedFloor.name } };
  } catch (err: any) {
    if (err?.code === "P2002") {
      return { error: `A floor named "${trimmed}" already exists` };
    }
    return { error: err?.message || "Failed to rename floor" };
  }
}

export async function deleteFloor(floorId: string, restaurantId: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    const floor = await prisma.floor.findFirst({ where: { id: floorId, restaurantId } });
    if (!floor) return { error: "Floor not found" };

    const remaining = await prisma.floor.count({ where: { restaurantId } });
    if (remaining <= 1) return { error: "You must keep at least one floor" };

    const tableCount = await prisma.restaurantTable.count({ where: { restaurantId, floor: floor.name } });
    if (tableCount > 0) {
      return { error: `Move or delete the ${tableCount} table${tableCount === 1 ? "" : "s"} on "${floor.name}" before deleting it` };
    }

    await prisma.floor.delete({ where: { id: floorId } });

    await logActivity(session, {
      actionType: "FLOOR_DELETE",
      entityType: "Floor",
      entityId: floorId,
      description: `Floor deleted`,
    });

    return { data: { id: floorId } };
  } catch (err: any) {
    return { error: err?.message || "Failed to delete floor" };
  }
}
