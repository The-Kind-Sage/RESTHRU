"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "./logs";

export type ComboItemData = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  variant?: string;
  addons?: string;
  imageUrl?: string | null;
  foodType?: string;
};

export async function createCombo(data: {
  restaurantId: string;
  name: string;
  menuSection?: string | null;
  categoryId?: string | null;
  price: number;
  offerPrice: number;
  comboType?: string | null;
  hsCode?: string | null;
  prepTime?: number;
  imageUrl?: string | null;
  description?: string | null;
  items: ComboItemData[];
}) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    const combo = await prisma.combo.create({
      data: {
        restaurantId: data.restaurantId,
        name: data.name,
        menuSection: data.menuSection?.trim() || null,
        categoryId: data.categoryId || null,
        price: data.price || 0,
        offerPrice: data.offerPrice || 0,
        comboType: data.comboType?.trim() || null,
        hsCode: data.hsCode?.trim() || null,
        prepTime: data.prepTime || 0,
        imageUrl: data.imageUrl || null,
        description: data.description || null,
        items: (data.items || []) as any,
      },
    });
    await logActivity(session, {
      actionType: "COMBO_ADD",
      entityType: "Combo",
      entityId: combo.id,
      description: `Combo "${combo.name}" created`,
    });
    return { data: combo };
  } catch (err: any) {
    return { error: err?.message || "Failed to create combo" };
  }
}

export async function getCombos(restaurantId: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    const combos = await prisma.combo.findMany({
      where: { restaurantId },
      include: { category: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return { data: combos };
  } catch (err: any) {
    return { error: err?.message || "Failed to load combos" };
  }
}

export async function updateCombo(id: string, data: Record<string, any>) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    const combo = await prisma.combo.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.menuSection !== undefined && { menuSection: data.menuSection || null }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId || null }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.offerPrice !== undefined && { offerPrice: data.offerPrice }),
        ...(data.comboType !== undefined && { comboType: data.comboType || null }),
        ...(data.hsCode !== undefined && { hsCode: data.hsCode || null }),
        ...(data.prepTime !== undefined && { prepTime: data.prepTime }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl || null }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.items !== undefined && { items: data.items }),
        ...(data.isAvailable !== undefined && { isAvailable: data.isAvailable }),
      },
    });
    await logActivity(session, {
      actionType: "COMBO_UPDATE",
      entityType: "Combo",
      entityId: id,
      description: `Combo "${combo.name}" updated`,
    });
    return { data: combo };
  } catch (err: any) {
    return { error: err?.message || "Failed to update combo" };
  }
}

export async function toggleComboAvailable(id: string, isAvailable: boolean) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    await prisma.combo.update({ where: { id }, data: { isAvailable } });
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "Failed to update combo" };
  }
}

export async function deleteCombo(id: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    await prisma.combo.delete({ where: { id } });
    await logActivity(session, {
      actionType: "COMBO_DELETE",
      entityType: "Combo",
      entityId: id,
      description: `Combo deleted`,
    });
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "Failed to delete combo" };
  }
}
