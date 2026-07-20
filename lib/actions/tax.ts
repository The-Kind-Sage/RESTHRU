"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "./logs";

export async function getTaxRates() {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const rates = await prisma.taxRate.findMany({
      where: { restaurantId: session.restaurantId },
      orderBy: { createdAt: "desc" },
    });
    return { data: rates };
  } catch (err: any) {
    return { error: err?.message || "Failed to fetch tax rates" };
  }
}

export async function createTaxRate(data: {
  name: string;
  rate: number;
  type?: string;
  isDefault?: boolean;
  appliesToItemTypes?: string[];
}) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    if (data.isDefault) {
      await prisma.taxRate.updateMany({
        where: { restaurantId: session.restaurantId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const rate = await prisma.taxRate.create({
      data: {
        restaurantId: session.restaurantId,
        name: data.name,
        rate: data.rate,
        type: data.type || "VAT",
        isDefault: data.isDefault || false,
        appliesToItemTypes: data.appliesToItemTypes || [],
      },
    });
    await logActivity(session, {
      actionType: "TAX_RATE_CREATE",
      entityType: "TaxRate",
      entityId: rate.id,
      description: `Tax rate "${rate.name}" (${rate.rate}%) created`,
    });
    return { data: rate };
  } catch (err: any) {
    return { error: err?.message || "Failed to create tax rate" };
  }
}

export async function updateTaxRate(
  id: string,
  data: {
    name?: string;
    rate?: number;
    type?: string;
    isDefault?: boolean;
    appliesToItemTypes?: string[];
    isActive?: boolean;
  },
) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    if (data.isDefault) {
      await prisma.taxRate.updateMany({
        where: { restaurantId: session.restaurantId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const rate = await prisma.taxRate.update({
      where: { id },
      data,
    });
    await logActivity(session, {
      actionType: "TAX_RATE_UPDATE",
      entityType: "TaxRate",
      entityId: id,
      description: `Tax rate "${rate.name}" updated`,
    });
    return { data: rate };
  } catch (err: any) {
    return { error: err?.message || "Failed to update tax rate" };
  }
}

export async function deleteTaxRate(id: string) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const rate = await prisma.taxRate.findFirst({
      where: { id, restaurantId: session.restaurantId },
    });
    if (!rate) return { error: "Tax rate not found" };
    if (rate.isDefault) return { error: "Cannot delete the default tax rate" };

    await prisma.taxRate.delete({ where: { id } });
    await logActivity(session, {
      actionType: "TAX_RATE_DELETE",
      entityType: "TaxRate",
      entityId: id,
      description: `Tax rate deleted`,
    });
    return { data: true };
  } catch (err: any) {
    return { error: err?.message || "Failed to delete tax rate" };
  }
}

export async function getDefaultTaxRate() {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const rate = await prisma.taxRate.findFirst({
      where: { restaurantId: session.restaurantId, isDefault: true, isActive: true },
    });
    return { data: rate };
  } catch (err: any) {
    return { error: err?.message || "Failed to fetch default tax rate" };
  }
}
