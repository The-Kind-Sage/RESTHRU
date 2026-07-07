"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function addCategory(data: {
  name: string;
  nameNp?: string;
  emoji?: string;
  sortOrder?: number;
  active?: boolean;
  restaurantId: string;
}) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    const result: { id: string }[] = await prisma.$queryRaw`
      INSERT INTO categories (id, restaurant_id, name, display_order, is_active, created_at, updated_at)
      VALUES (gen_random_uuid()::text, ${data.restaurantId}, ${data.name}, ${data.sortOrder || 0}, ${data.active ?? true}, now(), now())
      RETURNING id
    `;
    return { data: { id: result[0].id } };
  } catch (err: any) {
    return { error: err?.message || "Database error" };
  }
}

export async function updateCategory(
  id: string,
  data: {
    name: string;
    nameNp?: string;
    emoji?: string;
    sortOrder?: number;
    active?: boolean;
  }
) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    await prisma.$executeRaw`
      UPDATE categories
      SET name = ${data.name}, display_order = ${data.sortOrder || 0}, is_active = ${data.active ?? true}
      WHERE id = ${id}
    `;
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "Database error" };
  }
}

export async function deleteCategory(id: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    await prisma.$executeRaw`DELETE FROM categories WHERE id = ${id}`;
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "Database error" };
  }
}

export async function toggleCategoryActive(id: string, active: boolean) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    await prisma.$executeRaw`UPDATE categories SET is_active = ${active} WHERE id = ${id}`;
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "Database error" };
  }
}
