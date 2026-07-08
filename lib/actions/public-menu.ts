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

function buildTags(foodType: string, spiceLevel: string): string[] {
  const tags: string[] = [];
  if (foodType === "VEG") tags.push("vegan");
  if (["HOT", "EXTRA_HOT"].includes(spiceLevel)) tags.push("spicy");
  return tags;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function getBookMenuData(restaurantId: string) {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        operatingHours: { select: { dayOfWeek: true, isOpen: true, openTime: true, closeTime: true } },
      },
    });

    if (!restaurant) return null;

    const categories = await prisma.category.findMany({
      where: { restaurantId, isActive: true },
      orderBy: { displayOrder: "asc" },
    });

    const items = await prisma.menuItem.findMany({
      where: { restaurantId, isAvailable: true },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    });

    const hoursStr = restaurant.operatingHours
      .filter((h) => h.isOpen)
      .map((h) => {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        return `${days[h.dayOfWeek]} ${h.openTime}–${h.closeTime}`;
      })
      .join(" · ") || "Hours not set";

    const addressParts = [restaurant.street, restaurant.city, restaurant.state].filter(Boolean);
    const address = addressParts.length > 0 ? addressParts.join(", ") : "Address not set";

    const catMap = new Map<string, typeof categories[0]>();
    for (const c of categories) catMap.set(c.id, c);

    const grouped = new Map<string, {
      id: string;
      name: string;
      slug: string;
      items: {
        id: string;
        name: string;
        description: string;
        price: number;
        imageUrl: string | null;
        category: string;
        tags: string[];
        featured: boolean;
      }[];
    }>();

    for (const item of items) {
      const cat = catMap.get(item.categoryId);
      if (!cat) continue;

      if (!grouped.has(cat.id)) {
        grouped.set(cat.id, {
          id: cat.id,
          name: cat.name,
          slug: slugify(cat.name),
          items: [],
        });
      }

      const g = grouped.get(cat.id)!;
      g.items.push({
        id: item.id,
        name: item.name,
        description: item.description || "",
        price: Number(item.price),
        imageUrl: item.imageUrl,
        category: slugify(cat.name),
        tags: buildTags(item.foodType, item.spiceLevel),
        featured: false,
      });
    }

    const catEntries = Array.from(grouped.values());

    const drinksCat = catEntries.find(
      (c) => c.slug.includes("drink") || c.slug.includes("beverage") || c.slug.includes("beer") || c.slug.includes("wine") || c.slug.includes("cocktail") || c.name.toLowerCase().includes("drink") || c.name.toLowerCase().includes("beverage")
    );
    const drinksItems = drinksCat?.items ?? [];

    const normalCats = catEntries.filter((c) => c.id !== drinksCat?.id);

    const drinkGroups: ("wine" | "cocktail")[] = ["wine", "cocktail"];
    const drinks = drinksItems.length > 0
      ? drinksItems.map((item, i) => ({
          id: item.id,
          name: item.name,
          description: item.description || undefined,
          price: item.price,
          group: drinkGroups[i % 2],
          featured: item.featured,
        }))
      : [];

    return {
      restaurant: {
        name: restaurant.name,
        tagline: restaurant.description || "Welcome",
        established: `Est. ${restaurant.createdAt.getFullYear()}`,
        address,
        hours: hoursStr,
        phone: restaurant.phoneNumber || "Phone not set",
        website: restaurant.websiteUrl || "Website not set",
        social: restaurant.email ? `@${restaurant.email.split("@")[0]}` : "",
      },
      categories: normalCats,
      drinks,
    };
  } catch {
    return null;
  }
}
