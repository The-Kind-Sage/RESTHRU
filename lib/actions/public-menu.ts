"use server";

import prisma from "@/lib/prisma";

export async function getPublicMenuData(restaurantId: string) {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { name: true, street: true, phoneNumber: true },
    });

    if (!restaurant) return { restaurant: null, categories: [], items: [] };

    const categories = await prisma.category.findMany({
      where: { restaurantId, isActive: true },
      select: { id: true, name: true, imageUrl: true },
      orderBy: { displayOrder: "asc" },
    });

    const items = await prisma.menuItem.findMany({
      where: { restaurantId, isAvailable: true },
      select: {
        id: true, name: true, description: true, price: true,
        discountPrice: true, foodType: true, spiceLevel: true,
        imageUrl: true, categoryId: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return {
      restaurant: {
        name: restaurant.name,
        address: restaurant.street || undefined,
        phone: restaurant.phoneNumber || undefined,
        bgUrl: undefined,
        customMenuUrl: undefined,
      },
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        emoji: c.imageUrl || "📂",
      })),
      items: items.map((i) => ({
        id: i.id,
        name: i.name,
        description: i.description || undefined,
        price: i.price,
        discountPrice: i.discountPrice || undefined,
        foodType: i.foodType,
        spiceLevel: i.spiceLevel,
        image: i.imageUrl || undefined,
        categoryId: i.categoryId,
      })),
    };
  } catch {
    return { restaurant: null, categories: [], items: [] };
  }
}
