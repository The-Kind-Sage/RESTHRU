"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSession, clearSession, getSession } from "@/lib/auth";

export async function createSessionFromSupabaseLogin(userId: string, email: string, fullName?: string) {
  try {
    const restaurant = await prisma.restaurant.findFirst({
      where: { ownerId: userId },
      select: { id: true },
    });

    if (!restaurant) {
      return { error: "No restaurant found for this account" };
    }

    const nameParts = (fullName || email || "").trim().split(" ");

    await createSession({
      id: userId,
      username: email.split("@")[0] || "",
      role: "STAFF",
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
      email: email || "",
      restaurantId: restaurant.id,
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
