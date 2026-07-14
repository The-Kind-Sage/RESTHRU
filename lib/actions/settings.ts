"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function getRestaurant(restaurantId: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    return { data: restaurant };
  } catch (err: any) {
    return { error: err?.message || "Failed to load restaurant" };
  }
}

export async function getSettingsData(restaurantId: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    const result = await prisma.$queryRawUnsafe<Array<Record<string, any>>>(
      `SELECT * FROM restaurant_settings WHERE restaurant_id = $1`,
      restaurantId
    );
    return { data: result[0] || null };
  } catch {
    return { data: null };
  }
}

export async function getActiveSubscription(restaurantId: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    const sub = await prisma.subscription.findFirst({
      where: { restaurantId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      include: { plan: true },
    });
    return { data: sub };
  } catch (err: any) {
    return { error: err?.message || "Failed to load subscription" };
  }
}

export async function updateRestaurant(restaurantId: string, data: Record<string, any>) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    const allowedFields = [
      "name", "email", "street", "phoneNumber", "city", "timezone",
      "currency", "language", "taxPercentage", "bannerImageUrl",
    ];
    const updateData: Record<string, any> = {};
    for (const key of allowedFields) {
      if (key in data) updateData[key] = data[key];
    }
    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: updateData,
    });
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "Failed to save settings" };
  }
}

export async function upsertSettings(restaurantId: string, patch: Record<string, any>) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    const keys = Object.keys(patch);
    if (keys.length === 0) return { success: true };

    const setClauses = keys.map((k, i) => `${k} = $${i + 2}`);
    const values = [restaurantId, ...keys.map((k) => JSON.stringify(patch[k]))];

    await prisma.$executeRawUnsafe(
      `INSERT INTO restaurant_settings (restaurant_id, ${keys.join(", ")})
       VALUES ($1, ${keys.map((_, i) => `$${i + 2}`).join(", ")})
       ON CONFLICT (restaurant_id) DO UPDATE SET ${setClauses.join(", ")}`,
      ...values
    );
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "Failed to save settings" };
  }
}

export async function updateRestaurantDirect(restaurantId: string, updates: Record<string, any>) {
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
    return { error: err?.message || "Failed to update" };
  }
}

export async function updateCoverPhoto(restaurantId: string, coverUrl: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { bannerImageUrl: coverUrl },
    });
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "Failed to upload cover" };
  }
}

export async function cancelSubscription(restaurantId: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    const subscription = await prisma.subscription.findFirst({
      where: { restaurantId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });

    if (!subscription) return { error: "No active subscription found" };

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "CANCELLED", endDate: new Date() },
    });

    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "Failed to cancel subscription" };
  }
}

export async function getAvailablePlans() {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    });
    return { data: plans };
  } catch (err: any) {
    return { error: err?.message || "Failed to load plans" };
  }
}

export async function subscribeToPlan(restaurantId: string, planId: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return { error: "Plan not found" };

    // Cancel any existing active subscription
    const existing = await prisma.subscription.findFirst({
      where: { restaurantId, status: "ACTIVE" },
    });
    if (existing) {
      await prisma.subscription.update({
        where: { id: existing.id },
        data: { status: "CANCELLED", endDate: new Date() },
      });
    }

    // Create new subscription (1-year duration, same as registration)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    const subscription = await prisma.subscription.create({
      data: {
        restaurantId,
        planId,
        status: "ACTIVE",
        startDate,
        endDate,
        autoRenew: true,
        billingCycle: "MONTHLY",
        paymentMethod: "manual",
      },
      include: { plan: true },
    });

    return { data: subscription };
  } catch (err: any) {
    return { error: err?.message || "Failed to subscribe" };
  }
}

export async function setUserPassword(userId: string, newPassword: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    const bcrypt = (await import("bcryptjs")).default;
    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hash },
    });
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "Failed to change password" };
  }
}
