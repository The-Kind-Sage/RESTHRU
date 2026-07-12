"use server";

import prisma from "@/lib/prisma";
import { PLANS } from "@/lib/constants";

export interface PublicPlan {
  id: string;
  name: string;
  type: string;
  price: number;
  yearlyPrice: number;
  currency: string;
  features: string[];
  isPopular: boolean;
  color: string;
  description: string;
  maxTables: number;
  maxStaff: number;
  maxMenuItems: number;
  maxRestaurants: number;
}

/**
 * Fetch active plans from the DB for public display (pricing page, register
 * plan picker). Falls back to the hardcoded PLANS constant if the DB is
 * unreachable, so the site never goes blank even if the database is down.
 */
export async function getPublicPlans(): Promise<PublicPlan[]> {
  try {
    const dbPlans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    });

    if (dbPlans.length === 0) {
      return mapConstantPlans();
    }

    return dbPlans.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      price: p.monthlyPrice,
      yearlyPrice: p.annualPrice,
      currency: p.currency,
      features: p.features,
      isPopular: p.isPopular,
      color: p.colorHex,
      description: p.description,
      maxTables: p.maxTables,
      maxStaff: p.maxStaff,
      maxMenuItems: p.maxMenuItems,
      maxRestaurants: p.maxRestaurants,
    }));
  } catch {
    return mapConstantPlans();
  }
}

function mapConstantPlans(): PublicPlan[] {
  return PLANS.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.id.toUpperCase(),
    price: p.price,
    yearlyPrice: p.yearlyPrice || 0,
    currency: p.currency || "NPR",
    features: p.features,
    isPopular: p.isPopular || false,
    color: p.color || "#6b7280",
    description: "",
    maxTables: 10,
    maxStaff: 5,
    maxMenuItems: 50,
    maxRestaurants: 1,
  }));
}
