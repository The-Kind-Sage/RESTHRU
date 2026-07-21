"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "./logs";

// Like requireAdmin() in admin.ts: every export here reaches across tenants, so
// each one independently verifies the caller is a platform admin. Server Actions
// are directly invocable regardless of which UI gated navigation to them, so the
// check has to live in the action, not the page.
async function requireAdmin() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
    throw new Error("Unauthorized");
  }
  return session;
}

export type AdminMenuItem = {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description: string | null;
  price: number;
  discountPrice: number | null;
  itemType: string;
  foodType: string;
  spiceLevel: string;
  isAvailable: boolean;
  imageUrl: string | null;
  addOns: { id: string; name: string; price: number }[];
};

export type AdminMenuCategory = { id: string; name: string; isActive: boolean };

export type RestaurantMenuSummary = {
  id: string;
  name: string;
  city: string;
  isActive: boolean;
  itemCount: number;
  categoryCount: number;
};

/** Every restaurant on the platform with its live menu counts — powers the
 *  restaurant picker on the superadmin Menu Management page. */
export async function listRestaurantsWithMenuCounts(): Promise<RestaurantMenuSummary[]> {
  await requireAdmin();
  const restaurants = await prisma.restaurant.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      city: true,
      isActive: true,
      _count: { select: { menuItems: true, categories: true } },
    },
  });
  return restaurants.map((r) => ({
    id: r.id,
    name: r.name,
    city: r.city,
    isActive: r.isActive,
    itemCount: r._count.menuItems,
    categoryCount: r._count.categories,
  }));
}

/** Live menu for one restaurant. Reads straight from the shared tables, so any
 *  change an owner makes to their own menu is reflected here immediately. */
export async function getRestaurantMenu(restaurantId: string) {
  await requireAdmin();
  try {
    const [restaurant, categories, items] = await Promise.all([
      prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: { id: true, name: true, currency: true },
      }),
      prisma.category.findMany({
        where: { restaurantId },
        orderBy: { displayOrder: "asc" },
      }),
      prisma.menuItem.findMany({
        where: { restaurantId },
        include: { addOns: true, category: { select: { name: true } } },
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      }),
    ]);
    if (!restaurant) return { error: "Restaurant not found" };

    const mappedCategories: AdminMenuCategory[] = categories.map((c) => ({
      id: c.id,
      name: c.name,
      isActive: c.isActive,
    }));
    const mappedItems: AdminMenuItem[] = items.map((i) => ({
      id: i.id,
      categoryId: i.categoryId,
      categoryName: i.category?.name ?? "Uncategorised",
      name: i.name,
      description: i.description,
      price: i.price,
      discountPrice: i.discountPrice,
      itemType: i.itemType,
      foodType: i.foodType,
      spiceLevel: i.spiceLevel,
      isAvailable: i.isAvailable,
      imageUrl: i.imageUrl,
      addOns: i.addOns.map((a) => ({ id: a.id, name: a.name, price: a.price })),
    }));

    return {
      data: {
        restaurant: { id: restaurant.id, name: restaurant.name, currency: restaurant.currency },
        categories: mappedCategories,
        items: mappedItems,
      },
    };
  } catch (err: any) {
    return { error: err?.message || "Failed to load menu" };
  }
}

export async function adminAddCategory(restaurantId: string, name: string) {
  const session = await requireAdmin();
  if (!name.trim()) return { error: "Category name is required" };
  try {
    const last = await prisma.category.findFirst({
      where: { restaurantId },
      orderBy: { displayOrder: "desc" },
      select: { displayOrder: true },
    });
    const cat = await prisma.category.create({
      data: {
        restaurantId,
        name: name.trim(),
        displayOrder: (last?.displayOrder ?? 0) + 1,
        isActive: true,
      },
    });
    await logActivity(session, {
      restaurantId,
      actionType: "CATEGORY_ADD",
      entityType: "Category",
      entityId: cat.id,
      description: `Category "${cat.name}" added by platform admin`,
    });
    return { data: { id: cat.id } };
  } catch (err: any) {
    return { error: err?.message || "Failed to add category" };
  }
}

export async function adminDeleteCategory(categoryId: string) {
  const session = await requireAdmin();
  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { name: true, restaurantId: true, _count: { select: { menuItems: true } } },
    });
    if (!category) return { error: "Category not found" };
    if (category._count.menuItems > 0) {
      return { error: "Move or delete this category's items before deleting it" };
    }
    await prisma.category.delete({ where: { id: categoryId } });
    await logActivity(session, {
      restaurantId: category.restaurantId,
      actionType: "CATEGORY_DELETE",
      entityType: "Category",
      entityId: categoryId,
      description: `Category "${category.name}" deleted by platform admin`,
    });
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "Failed to delete category" };
  }
}

export async function adminAddMenuItem(data: {
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string | null;
  price: number;
  discountPrice?: number | null;
  itemType?: string;
  foodType?: string;
  spiceLevel?: string;
  isAvailable?: boolean;
}) {
  const session = await requireAdmin();
  if (!data.name.trim()) return { error: "Item name is required" };
  if (!data.categoryId) return { error: "A category is required" };
  if (!(data.price >= 0)) return { error: "Price must be zero or more" };
  try {
    const item = await prisma.menuItem.create({
      data: {
        restaurantId: data.restaurantId,
        categoryId: data.categoryId,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        price: data.price,
        discountPrice: data.discountPrice ?? null,
        itemType: (data.itemType || "FOOD").toUpperCase(),
        foodType: (data.foodType || "VEG").toUpperCase(),
        subType: (data.foodType || "VEG").toUpperCase(),
        spiceLevel: (data.spiceLevel || "NONE").toUpperCase(),
        isAvailable: data.isAvailable ?? true,
      },
    });
    await logActivity(session, {
      restaurantId: data.restaurantId,
      actionType: "MENU_ITEM_ADD",
      entityType: "MenuItem",
      entityId: item.id,
      description: `Menu item "${item.name}" added by platform admin`,
    });
    return { data: { id: item.id } };
  } catch (err: any) {
    return { error: err?.message || "Failed to add menu item" };
  }
}

export async function adminUpdateMenuItem(
  id: string,
  data: {
    name?: string;
    description?: string | null;
    price?: number;
    discountPrice?: number | null;
    categoryId?: string;
    itemType?: string;
    foodType?: string;
    spiceLevel?: string;
    isAvailable?: boolean;
  }
) {
  const session = await requireAdmin();
  try {
    const existing = await prisma.menuItem.findUnique({
      where: { id },
      select: { restaurantId: true, name: true },
    });
    if (!existing) return { error: "Menu item not found" };

    const updateData: Record<string, any> = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.discountPrice !== undefined) updateData.discountPrice = data.discountPrice;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.itemType !== undefined) updateData.itemType = data.itemType.toUpperCase();
    if (data.foodType !== undefined) {
      updateData.foodType = data.foodType.toUpperCase();
      updateData.subType = data.foodType.toUpperCase();
    }
    if (data.spiceLevel !== undefined) updateData.spiceLevel = data.spiceLevel.toUpperCase();
    if (data.isAvailable !== undefined) updateData.isAvailable = data.isAvailable;

    await prisma.menuItem.update({ where: { id }, data: updateData });
    await logActivity(session, {
      restaurantId: existing.restaurantId,
      actionType: "MENU_ITEM_UPDATE",
      entityType: "MenuItem",
      entityId: id,
      description: `Menu item "${data.name ?? existing.name}" updated by platform admin`,
    });
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "Failed to update menu item" };
  }
}

export async function adminToggleMenuItemAvailable(id: string, isAvailable: boolean) {
  const session = await requireAdmin();
  try {
    const existing = await prisma.menuItem.findUnique({
      where: { id },
      select: { restaurantId: true, name: true },
    });
    if (!existing) return { error: "Menu item not found" };
    await prisma.menuItem.update({ where: { id }, data: { isAvailable } });
    await logActivity(session, {
      restaurantId: existing.restaurantId,
      actionType: isAvailable ? "MENU_ITEM_AVAILABLE" : "MENU_ITEM_UNAVAILABLE",
      entityType: "MenuItem",
      entityId: id,
      description: `Menu item "${existing.name}" ${isAvailable ? "made available" : "marked unavailable"} by platform admin`,
    });
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "Failed to toggle availability" };
  }
}

export async function adminDeleteMenuItem(id: string) {
  const session = await requireAdmin();
  try {
    const existing = await prisma.menuItem.findUnique({
      where: { id },
      select: { restaurantId: true, name: true },
    });
    if (!existing) return { error: "Menu item not found" };
    // Remove add-ons first — they FK to the item.
    await prisma.$transaction([
      prisma.addOn.deleteMany({ where: { menuItemId: id } }),
      prisma.menuItem.delete({ where: { id } }),
    ]);
    await logActivity(session, {
      restaurantId: existing.restaurantId,
      actionType: "MENU_ITEM_DELETE",
      entityType: "MenuItem",
      entityId: id,
      description: `Menu item "${existing.name}" deleted by platform admin`,
    });
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "Failed to delete menu item" };
  }
}

/**
 * Copies menu items from one restaurant into another. Categories are matched to
 * the target by name (case-insensitive) and created there when missing, so the
 * pasted items keep their menu structure. Add-ons are copied too. Superadmin-only
 * and deliberately plan-limit-free — the platform admin is trusted to seed menus.
 */
export async function copyMenuItems(input: {
  sourceRestaurantId: string;
  targetRestaurantId: string;
  itemIds?: string[];
}) {
  const session = await requireAdmin();
  if (input.sourceRestaurantId === input.targetRestaurantId) {
    return { error: "Pick a different restaurant to paste into" };
  }
  try {
    const [source, target] = await Promise.all([
      prisma.restaurant.findUnique({
        where: { id: input.sourceRestaurantId },
        select: { id: true, name: true },
      }),
      prisma.restaurant.findUnique({
        where: { id: input.targetRestaurantId },
        select: { id: true, name: true },
      }),
    ]);
    if (!source) return { error: "Source restaurant not found" };
    if (!target) return { error: "Target restaurant not found" };

    const items = await prisma.menuItem.findMany({
      where: {
        restaurantId: input.sourceRestaurantId,
        ...(input.itemIds && input.itemIds.length ? { id: { in: input.itemIds } } : {}),
      },
      include: { addOns: true, category: { select: { name: true, displayOrder: true } } },
    });
    if (items.length === 0) return { error: "No items to copy" };

    // Match categories to the target by name so pasted items land under the
    // right section, creating any that don't exist yet.
    const targetCats = await prisma.category.findMany({
      where: { restaurantId: input.targetRestaurantId },
      select: { id: true, name: true },
    });
    const catByName = new Map(targetCats.map((c) => [c.name.toLowerCase(), c.id]));

    let copied = 0;
    await prisma.$transaction(
      async (tx) => {
        for (const item of items) {
          const catName = item.category?.name ?? "Imported";
          let categoryId = catByName.get(catName.toLowerCase());
          if (!categoryId) {
            const newCat = await tx.category.create({
              data: {
                restaurantId: input.targetRestaurantId,
                name: catName,
                displayOrder: item.category?.displayOrder ?? 0,
                isActive: true,
              },
            });
            categoryId = newCat.id;
            catByName.set(catName.toLowerCase(), newCat.id);
          }

          const created = await tx.menuItem.create({
            data: {
              restaurantId: input.targetRestaurantId,
              categoryId,
              name: item.name,
              description: item.description,
              price: item.price,
              discountPrice: item.discountPrice,
              menuSection: item.menuSection,
              itemType: item.itemType,
              foodType: item.foodType,
              subType: item.subType,
              spiceLevel: item.spiceLevel,
              allergens: item.allergens,
              prepTime: item.prepTime,
              calories: item.calories,
              ingredients: item.ingredients,
              temperature: item.temperature,
              volume: item.volume,
              sizeOptions: item.sizeOptions === null ? undefined : (item.sizeOptions as any),
              isAvailable: item.isAvailable,
              imageUrl: item.imageUrl,
              displayOrder: item.displayOrder,
            },
          });

          if (item.addOns.length) {
            await tx.addOn.createMany({
              data: item.addOns.map((a) => ({
                menuItemId: created.id,
                name: a.name,
                description: a.description,
                price: a.price,
                isAvailable: a.isAvailable,
              })),
            });
          }
          copied++;
        }
      },
      { timeout: 30000, maxWait: 10000 }
    );

    // Log on both sides so the trail is visible from either restaurant.
    await logActivity(session, {
      restaurantId: input.targetRestaurantId,
      actionType: "MENU_ITEMS_IMPORT",
      entityType: "MenuItem",
      entityId: input.targetRestaurantId,
      description: `${copied} menu item(s) copied in from "${source.name}" by platform admin`,
    });
    await logActivity(session, {
      restaurantId: input.sourceRestaurantId,
      actionType: "MENU_ITEMS_EXPORT",
      entityType: "MenuItem",
      entityId: input.sourceRestaurantId,
      description: `${copied} menu item(s) copied out to "${target.name}" by platform admin`,
    });

    return { data: { copied, sourceName: source.name, targetName: target.name } };
  } catch (err: any) {
    return { error: err?.message || "Failed to copy menu items" };
  }
}
