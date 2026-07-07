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

  const result: { id: string }[] = await prisma.$queryRaw`
    INSERT INTO categories (restaurant_id, name, name_np, icon, sort_order, is_active)
    VALUES (${data.restaurantId}::uuid, ${data.name}, ${data.nameNp || null}, ${data.emoji || "📂"}, ${data.sortOrder || 0}, ${data.active ?? true})
    RETURNING id::text
  `;

  return { data: { id: result[0].id } };
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

  await prisma.$executeRaw`
    UPDATE categories
    SET name = ${data.name}, name_np = ${data.nameNp || null}, icon = ${data.emoji || "📂"},
        sort_order = ${data.sortOrder || 0}, is_active = ${data.active ?? true}
    WHERE id = ${id}::uuid
  `;

  return { success: true };
}

export async function deleteCategory(id: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  await prisma.$executeRaw`DELETE FROM categories WHERE id = ${id}::uuid`;

  return { success: true };
}

export async function toggleCategoryActive(id: string, active: boolean) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  await prisma.$executeRaw`UPDATE categories SET is_active = ${active} WHERE id = ${id}::uuid`;

  return { success: true };
}
