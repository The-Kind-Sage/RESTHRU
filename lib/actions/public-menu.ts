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
        imageUrl: true, categoryId: true, calories: true,
        prepTime: true, allergens: true,
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

function normalizeMenuSection(section?: string | null): string {
  const raw = (section || "").trim();
  const normalized = raw.toLowerCase();

  if (["appetizer", "appetizers", "starter", "starters", "small plate", "small plates", "hors d'oeuvre", "hors doeuvre"].includes(normalized)) {
    return "Appetizers";
  }
  if (["main course", "main courses", "mains", "entree", "entrees", "signature", "special", "specials", "plat", "plats", "grill", "grills"].includes(normalized)) {
    return "Main Courses";
  }
  if (["dessert", "desserts", "sweet", "sweets", "cake", "cakes", "pastry", "pastries", "ice cream", "ice-cream", "pudding", "puddings", "bakery"].includes(normalized)) {
    return "Desserts";
  }
  if (["beverage", "beverages", "drink", "drinks", "cocktail", "cocktails", "wine", "wines", "tea", "coffee", "juice"].includes(normalized)) {
    return "Beverages";
  }
  if (["extra", "extras", "side", "sides", "misc", "other", "others"].includes(normalized)) {
    return "Extra";
  }

  return raw || "Appetizers";
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

    const categoryRecords = await prisma.category.findMany({
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
        details: string[];
        featured: boolean;
      }[];
    }>();

    const drinks: Array<{ id: string; name: string; description?: string; price: number; group: "wine" | "cocktail"; featured: boolean }> = [];

    for (const item of items) {
      const sectionName = normalizeMenuSection(item.menuSection);
      const details: string[] = [];

      if (item.calories) details.push(`${item.calories} kcal`);
      if (item.prepTime) details.push(`${item.prepTime} min`);
      if (item.spiceLevel && item.spiceLevel !== "NONE") details.push(item.spiceLevel.replace(/_/g, " ").toLowerCase());
      if (item.allergens?.length) details.push(`contains ${item.allergens.join(", ")}`);

      if (sectionName === "Beverages") {
        drinks.push({
          id: item.id,
          name: item.name,
          description: item.description || undefined,
          price: Number(item.price),
          group: drinks.length % 2 === 0 ? "wine" : "cocktail",
          featured: false,
        });
        continue;
      }

      if (!grouped.has(sectionName)) {
        grouped.set(sectionName, {
          id: sectionName,
          name: sectionName,
          slug: slugify(sectionName),
          items: [],
        });
      }

      const g = grouped.get(sectionName)!;
      g.items.push({
        id: item.id,
        name: item.name,
        description: item.description || "",
        price: Number(item.price),
        imageUrl: item.imageUrl,
        category: slugify(sectionName),
        tags: buildTags(item.foodType, item.spiceLevel),
        details,
        featured: false,
      });
    }

    const sectionOrder = ["Appetizers", "Main Courses", "Desserts", "Extra"];
    const orderedSections = sectionOrder
      .map((sectionName) => Array.from(grouped.values()).find((entry) => entry.name === sectionName))
      .filter(Boolean) as Array<{
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
          details: string[];
          featured: boolean;
        }[];
      }>;
    const remainingSections = Array.from(grouped.values()).filter((entry) => !sectionOrder.includes(entry.name));
    const categories = [...orderedSections, ...remainingSections];

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
      categories,
      drinks,
    };
  } catch {
    return null;
  }
}
