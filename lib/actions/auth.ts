"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSession, clearSession, getSession } from "@/lib/auth";

export async function createSessionFromSupabaseLogin(userId: string, email: string, fullName?: string) {
  try {
    const nameParts = (fullName || email || "").trim().split(" ");

    // Find or create a Prisma user
    let prismaUser = await prisma.user.findUnique({ where: { email } });
    if (!prismaUser) {
      prismaUser = await prisma.user.create({
        data: {
          email,
          username: email.split("@")[0] || "",
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
    console.error("createSessionFromSupabaseLogin error:", err);
    return { error: "Failed to create session" };
  }
}

export async function login(username: string, password: string, redirectTo?: string) {
  const user = await prisma.user.findFirst({
    where: { username, isActive: true },
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

    // Also create in Supabase for backwards compatibility
    const { supabase } = await import('@/lib/supabase');
    if (supabase) {
      const slug = data.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        + '-' + Math.random().toString(36).slice(2, 7);
      await supabase.from('restaurants').insert([{
        id: restaurant.id,
        owner_id: data.ownerId,
        name: data.name,
        slug,
        type: data.type,
        address: data.address || '',
        city: data.city || '',
        phone: data.phone || '',
        num_tables: data.numTables || 0,
      }]).select('id').maybeSingle();
    }

    return { restaurantId: restaurant.id };
  } catch (err: any) {
    return { error: err?.message || 'Failed to create restaurant' };
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
