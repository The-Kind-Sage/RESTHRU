"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { checkResourceLimit, limitMessage } from "@/lib/plan-guard";
import { logActivity } from "./logs";

export async function getTables(restaurantId: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    const tables = await prisma.restaurantTable.findMany({
      where: { restaurantId },
      orderBy: { tableNumber: "asc" },
    });
    return { data: tables };
  } catch (err: any) {
    return { error: err?.message || "Failed to load tables" };
  }
}

export async function addTable(data: {
  restaurantId: string;
  tableNumber: number;
  name?: string;
  capacity: number;
  shape: string;
  space: string;
  positionX: number;
  positionY: number;
}) {
  const session = await getSession();
  if (!session || !session.restaurantId) return { error: "Not authenticated" };

  // Enforce the plan's table cap before inserting.
  const limitReached = await checkResourceLimit(session.restaurantId, "tables");
  if (limitReached) return { error: limitMessage(limitReached), limitReached };

  try {
    const table = await prisma.restaurantTable.create({
      data: {
        // Always create under the caller's own restaurant
        restaurantId: session.restaurantId,
        tableNumber: data.tableNumber,
        name: data.name || null,
        capacity: data.capacity,
        shape: data.shape,
        space: data.space,
        positionX: data.positionX,
        positionY: data.positionY,
      },
    });
    await logActivity(session, {
      actionType: "TABLE_ADD",
      entityType: "RestaurantTable",
      entityId: table.id,
      description: `Table "${table.name || table.tableNumber}" added`,
    });
    return { data: { id: table.id } };
  } catch (err: any) {
    if (err?.code === "P2002") {
      return { error: `Table ${data.tableNumber} already exists` };
    }
    return { error: err?.message || "Failed to add table" };
  }
}

export async function updateTableStatus(id: string, status: string) {
  const session = await getSession();
  if (!session || !session.restaurantId) return { error: "Not authenticated" };

  try {
    const result = await prisma.restaurantTable.updateMany({
      where: { id, restaurantId: session.restaurantId },
      data: { status },
    });
    if (result.count === 0) return { error: "Table not found" };
    await logActivity(session, {
      actionType: "TABLE_STATUS_UPDATE",
      entityType: "RestaurantTable",
      entityId: id,
      description: `Table status updated to ${status}`,
    });
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "Failed to update table status" };
  }
}

export async function updateTablePosition(id: string, x: number, y: number) {
  const session = await getSession();
  if (!session || !session.restaurantId) return { error: "Not authenticated" };

  try {
    const result = await prisma.restaurantTable.updateMany({
      where: { id, restaurantId: session.restaurantId },
      data: { positionX: x, positionY: y },
    });
    if (result.count === 0) return { error: "Table not found" };
    await logActivity(session, {
      actionType: "TABLE_POSITION_UPDATE",
      entityType: "RestaurantTable",
      entityId: id,
      description: `Table position updated`,
    });
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "Failed to update table position" };
  }
}

export async function deleteTable(id: string) {
  const session = await getSession();
  if (!session || !session.restaurantId) return { error: "Not authenticated" };

  try {
    // Don't delete a table that still has orders attached — history would break
    const hasOrders = await prisma.order.findFirst({
      where: { tableId: id },
      select: { id: true },
    });
    if (hasOrders) {
      return { error: "This table has order history. Mark it unavailable instead of deleting." };
    }

    const result = await prisma.restaurantTable.deleteMany({
      where: { id, restaurantId: session.restaurantId },
    });
    if (result.count === 0) return { error: "Table not found" };
    await logActivity(session, {
      actionType: "TABLE_DELETE",
      entityType: "RestaurantTable",
      entityId: id,
      description: `Table deleted`,
    });
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "Failed to delete table" };
  }
}
