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

// ── Menu Items ──────────────────────────────────────────────────────────────

export async function getMenuItems(restaurantId: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    const items = await prisma.menuItem.findMany({
      where: { restaurantId },
      include: { addOns: true },
      orderBy: { createdAt: "desc" },
    });
    return { data: items };
  } catch (err: any) {
    return { error: err?.message || "Failed to load menu items" };
  }
}

export async function addMenuItem(data: {
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string | null;
  price: number;
  discountPrice?: number | null;
  menuSection?: string | null;
  itemType?: string;
  foodType?: string;
  subType?: string;
  spiceLevel?: string;
  prepTime?: number;
  isAvailable?: boolean;
  allergens?: string[];
  imageUrl?: string | null;
  temperature?: string | null;
  volume?: number | null;
  sizeOptions?: any;
}) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    const item = await prisma.menuItem.create({
      data: {
        restaurantId: data.restaurantId,
        categoryId: data.categoryId,
        name: data.name,
        description: data.description || null,
        price: data.price,
        discountPrice: data.discountPrice || null,
        menuSection: data.menuSection?.trim() || null,
        itemType: (data.itemType || "food").toUpperCase(),
        foodType: (data.foodType || "veg").toUpperCase(),
        subType: (data.subType || "veg").toUpperCase(),
        spiceLevel: (data.spiceLevel || "none").toUpperCase(),
        prepTime: data.prepTime || 15,
        isAvailable: data.isAvailable ?? true,
        allergens: data.allergens || [],
        imageUrl: data.imageUrl || null,
        temperature: data.temperature ? data.temperature.toUpperCase() : null,
        volume: data.volume || null,
        sizeOptions: data.sizeOptions || null,
      },
    });
    return { data: item };
  } catch (err: any) {
    return { error: err?.message || "Failed to add menu item" };
  }
}

export async function updateMenuItem(id: string, data: Record<string, any>) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    const updateData: Record<string, any> = {};
    const fieldMap: Record<string, string> = {
      name: "name",
      description: "description",
      price: "price",
      discountPrice: "discountPrice",
      menuSection: "menuSection",
      categoryId: "categoryId",
      itemType: "itemType",
      foodType: "foodType",
      subType: "subType",
      spiceLevel: "spiceLevel",
      prepTime: "prepTime",
      isAvailable: "isAvailable",
      allergens: "allergens",
      imageUrl: "imageUrl",
      temperature: "temperature",
      volume: "volume",
      sizeOptions: "sizeOptions",
    };
    for (const [key, field] of Object.entries(fieldMap)) {
      if (key in data) {
        let val = data[key];
        if (typeof val === "string" && ["itemType", "foodType", "subType", "spiceLevel", "temperature"].includes(key)) {
          val = val.toUpperCase();
        }
        updateData[field] = val;
      }
    }
    await prisma.menuItem.update({ where: { id }, data: updateData });
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "Failed to update menu item" };
  }
}

export async function deleteMenuItem(id: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    await prisma.menuItem.delete({ where: { id } });
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "Failed to delete menu item" };
  }
}

export async function toggleMenuItemAvailable(id: string, isAvailable: boolean) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    await prisma.menuItem.update({ where: { id }, data: { isAvailable } });
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "Failed to toggle availability" };
  }
}

export async function getCategories(restaurantId: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    const cats = await prisma.category.findMany({
      where: { restaurantId },
      orderBy: { displayOrder: "asc" },
    });
    return { data: cats };
  } catch (err: any) {
    return { error: err?.message || "Failed to load categories" };
  }
}

export async function getMenuSettings(restaurantId: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { bannerImageUrl: true },
    });
    let menuBgUrl: string | null = null;
    let menuCustomUrl: string | null = null;
    try {
      const raw = await prisma.$queryRawUnsafe<Array<Record<string, any>>>(
        `SELECT menu_bg_url, menu_custom_url FROM restaurants WHERE id = $1`,
        restaurantId
      );
      if (raw[0]) {
        menuBgUrl = raw[0].menu_bg_url || null;
        menuCustomUrl = raw[0].menu_custom_url || null;
      }
    } catch {}
    return { data: { menuBgUrl, menuCustomUrl, bannerImageUrl: restaurant?.bannerImageUrl || null } };
  } catch (err: any) {
    return { error: err?.message || "Failed to load menu settings" };
  }
}

export async function updateMenuSettings(restaurantId: string, updates: Record<string, any>) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    const setClauses = Object.keys(updates)
      .map((k, i) => `${k} = $${i + 2}`);
    const values = [restaurantId, ...Object.values(updates)];

    await prisma.$executeRawUnsafe(
      `UPDATE restaurants SET ${setClauses.join(", ")} WHERE id = $1`,
      ...values
    );
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "Failed to save menu settings" };
  }
}
