"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSession, clearSession, getSession } from "@/lib/auth";

function generateUsername(email: string): string {
  let base = email.split("@")[0] || "user";
  // Replace non-alphanumeric chars (except - and _) to keep it safe
  base = base.replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase();
  // Append short random suffix to avoid unique constraint collisions
  return `${base}_${Math.random().toString(36).substring(2, 7)}`;
}

export async function createSessionFromSupabaseLogin(userId: string, email: string, fullName?: string) {
  try {
    const dbUrl = process.env.DATABASE_URL || "NOT SET";
    const portMatch = dbUrl.match(/:(\d+)\//);
    console.log("[debug] DATABASE_URL port:", portMatch ? portMatch[1] : "unknown", "| has sslmode:", dbUrl.includes("sslmode"), "| has pgbouncer:", dbUrl.includes("pgbouncer"));
    const nameParts = (fullName || email || "").trim().split(" ");

    // Find or create a Prisma user
    let prismaUser = await prisma.user.findUnique({ where: { email } });
    if (!prismaUser) {
      prismaUser = await prisma.user.create({
        data: {
          email,
          username: generateUsername(email),
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(" ") || "",
          role: "STAFF",
          isActive: true,
        },
      });
    }

    // Find restaurant by ownerId (may have been inserted via Supabase already)
    let restaurant = await prisma.restaurant.findFirst({
      where: { ownerId: userId },
      select: { id: true },
    });

    // Link Prisma user to restaurant if not already linked
    if (restaurant && !prismaUser.restaurantId) {
      await prisma.user.update({
        where: { id: prismaUser.id },
        data: { restaurantId: restaurant.id },
      });
      prismaUser.restaurantId = restaurant.id;
    }

    await createSession({
      id: prismaUser.id,
      username: prismaUser.username || "",
      role: prismaUser.role,
      firstName: prismaUser.firstName,
      lastName: prismaUser.lastName,
      email: prismaUser.email,
      restaurantId: restaurant?.id ?? prismaUser.restaurantId ?? null,
    });

    return { success: true, redirectTo: "/dashboard" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("createSessionFromSupabaseLogin error:", message, err instanceof Error ? err.stack : "");
    return { error: "Failed to create session" };
  }
}

export async function login(username: string, password: string, redirectTo?: string) {
  try {
    // Allow login by email OR username
    const user = await prisma.user.findFirst({
      where: { OR: [{ username }, { email: username }], isActive: true },
    });

    if (!user || !user.passwordHash) {
      return { error: "Invalid username or password" };
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return { error: "Invalid username or password" };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await createSession({
      id: user.id,
      username: user.username || "",
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      restaurantId: user.restaurantId,
    });

    const destination = redirectTo || (user.role === "ADMIN" ? "/admin" : "/dashboard");
    return { success: true, redirectTo: destination };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("login error:", message, err instanceof Error ? err.stack : "");
    return { error: "Failed to create session" };
  }
}

export async function createRestaurant(data: {
  ownerId: string;
  name: string;
  type: string;
  address?: string;
  city?: string;
  phone?: string;
  panNumber?: string;
  vatRegistered?: boolean;
  vatNumber?: string;
  numTables?: number;
  operatingHours?: any;
}) {
  try {
    const restaurant = await prisma.restaurant.create({
      data: {
        ownerId: data.ownerId,
        name: data.name,
        type: data.type.toUpperCase().replace(/\s+/g, '_'),
        street: data.address || '',
        city: data.city || '',
        phoneNumber: data.phone || '',
        totalTables: data.numTables || 0,
        isActive: true,
      },
    });

    return { restaurantId: restaurant.id };
  } catch (err: any) {
    return { error: err?.message || 'Failed to create restaurant' };
  }
}

export async function register(data: {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  restaurantName: string;
  restaurantType: string;
  address?: string;
  city?: string;
  restaurantPhone?: string;
  planId?: string;
}) {
  try {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return { error: "An account with this email already exists" };
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const nameParts = data.fullName.trim().split(" ");

    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: generateUsername(data.email),
        passwordHash,
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        phoneNumber: data.phone || "",
        role: "STAFF",
        isActive: true,
      },
    });

    const restaurant = await prisma.restaurant.create({
      data: {
        ownerId: user.id,
        name: data.restaurantName,
        type: data.restaurantType.toUpperCase().replace(/\s+/g, '_'),
        street: data.address || '',
        city: data.city || '',
        phoneNumber: data.restaurantPhone || '',
        totalTables: 0,
        isActive: true,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { restaurantId: restaurant.id },
    });

    if (data.planId) {
      const plan = await prisma.plan.findUnique({ where: { type: data.planId.toUpperCase() } });
      if (plan) {
        await prisma.subscription.create({
          data: {
            restaurantId: restaurant.id,
            planId: plan.id,
            status: "ACTIVE",
            startDate: new Date(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            billingCycle: "MONTHLY",
          },
        });
      }
    }

    await createSession({
      id: user.id,
      username: user.username || "",
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      restaurantId: restaurant.id,
    });

    return { success: true, redirectTo: "/dashboard" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("register error:", message, err instanceof Error ? err.stack : "");
    return { error: "Failed to create account" };
  }
}

export async function logout() {
  await clearSession();
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, username: true, firstName: true, lastName: true, email: true, role: true, restaurantId: true },
  });

  return user;
}

export async function getRestaurantFromSession() {
  const session = await getSession();
  if (!session) return null;

  // Try restaurantId from the JWT first
  if (session.restaurantId) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: session.restaurantId },
      select: { id: true, name: true },
    });
    if (restaurant) return restaurant;
  }

  // Fallback: find restaurant where this user is the owner
  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: session.id },
    select: { id: true, name: true },
  });

  return restaurant;
}

export async function getUserFromSession() {
  const session = await getSession();
  if (!session) return null;

  return {
    id: session.id,
    email: session.email,
    firstName: session.firstName,
    lastName: session.lastName,
    role: session.role,
  };
}

export async function changePassword(
  username: string,
  currentPassword: string,
  newPassword: string
) {
  if (newPassword.length < 6) {
    return { error: "New password must be at least 6 characters" };
  }

  const user = await prisma.user.findFirst({
    where: { username, isActive: true },
  });

  if (!user || !user.passwordHash) {
    return { error: "User not found" };
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return { error: "Current password is incorrect" };
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hash },
  });

  return { success: true };
}

export async function resetPassword(username: string, newPassword: string) {
  if (newPassword.length < 6) {
    return { error: "New password must be at least 6 characters" };
  }

  const user = await prisma.user.findFirst({
    where: { username, isActive: true },
  });

  if (!user) {
    return { error: "User not found" };
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hash },
  });

  return { success: true };
}
