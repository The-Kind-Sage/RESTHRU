"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function getInventoryItems(restaurantId: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    const items = await prisma.inventoryItem.findMany({
      where: { restaurantId },
      orderBy: { createdAt: "desc" },
    });
    return { data: items };
  } catch (err: any) {
    return { error: err?.message || "Failed to load inventory" };
  }
}

export async function addInventoryItem(data: {
  restaurantId: string;
  name: string;
  category?: string;
  currentStock: number;
  unit: string;
  minThreshold: number;
}) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    const item = await prisma.inventoryItem.create({
      data: {
        restaurantId: data.restaurantId,
        name: data.name,
        description: data.category || null,
        currentQuantity: data.currentStock,
        unit: data.unit,
        reorderLevel: data.minThreshold,
      },
    });
    return { data: item };
  } catch (err: any) {
    return { error: err?.message || "Failed to add item" };
  }
}
