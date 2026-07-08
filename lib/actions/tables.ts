"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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
  floor: string;
  positionX: number;
  positionY: number;
}) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    const table = await prisma.restaurantTable.create({
      data: {
        restaurantId: data.restaurantId,
        tableNumber: data.tableNumber,
        name: data.name || null,
        capacity: data.capacity,
        shape: data.shape,
        floor: data.floor,
        positionX: data.positionX,
        positionY: data.positionY,
      },
    });
    return { data: { id: table.id } };
  } catch (err: any) {
    return { error: err?.message || "Failed to add table" };
  }
}

export async function updateTableStatus(id: string, status: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    await prisma.restaurantTable.update({
      where: { id },
      data: { status: status as any },
    });
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "Failed to update table status" };
  }
}

export async function updateTablePosition(id: string, x: number, y: number) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    await prisma.restaurantTable.update({
      where: { id },
      data: { positionX: x, positionY: y },
    });
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "Failed to update table position" };
  }
}

export async function deleteTable(id: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    await prisma.restaurantTable.delete({ where: { id } });
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "Failed to delete table" };
  }
}
