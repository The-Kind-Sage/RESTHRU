"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function requireAdmin(session: { role: string } | null): void {
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
    throw new Error("Unauthorized");
  }
}

export async function getPlans() {
  const session = await getSession();
  try {
    requireAdmin(session);
  } catch {
    return { error: "Unauthorized" };
  }

  try {
    const plans = await prisma.plan.findMany({ orderBy: { displayOrder: "asc" } });
    return { data: plans };
  } catch (err: any) {
    return { error: err?.message || "Failed to load plans" };
  }
}

export async function createPlan(data: {
  type: string;
  name: string;
  description?: string;
  monthlyPrice?: number;
  annualPrice?: number;
  currency?: string;
  maxRestaurants?: number;
  maxTables?: number;
  maxStaff?: number;
  maxMenuItems?: number;
  features?: string[];
  displayOrder?: number;
  isPopular?: boolean;
  colorHex?: string;
  isActive?: boolean;
}) {
  const session = await getSession();
  try {
    requireAdmin(session);
  } catch {
    return { error: "Unauthorized" };
  }

  try {
    const plan = await prisma.plan.create({
      data: {
        type: data.type.toUpperCase(),
        name: data.name,
        description: data.description || "",
        monthlyPrice: data.monthlyPrice ?? 0,
        annualPrice: data.annualPrice ?? 0,
        currency: data.currency || "NPR",
        maxRestaurants: data.maxRestaurants ?? 1,
        maxTables: data.maxTables ?? 10,
        maxStaff: data.maxStaff ?? 5,
        maxMenuItems: data.maxMenuItems ?? 50,
        features: data.features || [],
        displayOrder: data.displayOrder ?? 0,
        isPopular: data.isPopular ?? false,
        colorHex: data.colorHex || "#6b7280",
        isActive: data.isActive ?? true,
      },
    });
    return { data: plan };
  } catch (err: any) {
    if (err?.code === "P2002") return { error: "A plan with this type already exists" };
    return { error: err?.message || "Failed to create plan" };
  }
}

export async function updatePlan(
  id: string,
  data: {
    type?: string;
    name?: string;
    description?: string;
    monthlyPrice?: number;
    annualPrice?: number;
    currency?: string;
    maxRestaurants?: number;
    maxTables?: number;
    maxStaff?: number;
    maxMenuItems?: number;
    features?: string[];
    displayOrder?: number;
    isPopular?: boolean;
    colorHex?: string;
    isActive?: boolean;
  }
) {
  const session = await getSession();
  try {
    requireAdmin(session);
  } catch {
    return { error: "Unauthorized" };
  }

  const updateData: any = {};
  if (data.type !== undefined) updateData.type = data.type.toUpperCase();
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.monthlyPrice !== undefined) updateData.monthlyPrice = data.monthlyPrice;
  if (data.annualPrice !== undefined) updateData.annualPrice = data.annualPrice;
  if (data.currency !== undefined) updateData.currency = data.currency;
  if (data.maxRestaurants !== undefined) updateData.maxRestaurants = data.maxRestaurants;
  if (data.maxTables !== undefined) updateData.maxTables = data.maxTables;
  if (data.maxStaff !== undefined) updateData.maxStaff = data.maxStaff;
  if (data.maxMenuItems !== undefined) updateData.maxMenuItems = data.maxMenuItems;
  if (data.features !== undefined) updateData.features = data.features;
  if (data.displayOrder !== undefined) updateData.displayOrder = data.displayOrder;
  if (data.isPopular !== undefined) updateData.isPopular = data.isPopular;
  if (data.colorHex !== undefined) updateData.colorHex = data.colorHex;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  try {
    const plan = await prisma.plan.update({ where: { id }, data: updateData });
    return { data: plan };
  } catch (err: any) {
    if (err?.code === "P2002") return { error: "A plan with this type already exists" };
    return { error: err?.message || "Failed to update plan" };
  }
}

export async function deletePlan(id: string) {
  const session = await getSession();
  try {
    requireAdmin(session);
  } catch {
    return { error: "Unauthorized" };
  }

  try {
    const subCount = await prisma.subscription.count({ where: { planId: id } });
    if (subCount > 0) {
      return { error: `Cannot delete plan: ${subCount} subscription(s) are using it` };
    }
    await prisma.plan.delete({ where: { id } });
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "Failed to delete plan" };
  }
}
