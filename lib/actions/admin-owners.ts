"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { logActivity } from "./logs";

// Cross-tenant owner management for the platform admin console. Like the other
// admin.* modules, every export re-checks the caller is an admin because Server
// Actions are directly invocable regardless of which UI reached them.
async function requireAdmin() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
    throw new Error("Unauthorized");
  }
  return session;
}

// Owners can be linked to their restaurant two ways: via User.restaurantId, or
// only via Restaurant.ownerId (with User.restaurantId left null). Resolve both.
async function resolveOwnerRestaurantId(userId: string, restaurantId: string | null): Promise<string> {
  if (restaurantId) return restaurantId;
  const owned = await prisma.restaurant.findFirst({ where: { ownerId: userId }, select: { id: true } });
  return owned?.id ?? "";
}

// Load an owner, guarding that the target really is a RESTAURANT_OWNER so this
// console can't be used to edit staff/admin accounts.
async function loadOwner(userId: string) {
  return prisma.user.findFirst({
    where: { id: userId, role: "RESTAURANT_OWNER" },
    select: { id: true, restaurantId: true, firstName: true, lastName: true },
  });
}

export type OwnerListItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string | null;
  phoneNumber: string | null;
  profileImage: string | null;
  isActive: boolean;
  isVerified: boolean;
  identityDocType: string;
  createdAt: string;
  lastLoginAt: string | null;
  restaurant: { id: string; name: string; isActive: boolean } | null;
};

export type OwnerDetail = OwnerListItem & {
  dateOfBirth: string | null;
  address: string | null;
  identityDocNumber: string | null;
  identityDocImage: string | null;
  identityDocBackImage: string | null;
  verifiedAt: string | null;
  adminNotes: string | null;
};

/** Every restaurant owner on the platform, newest first, with optional search. */
export async function listOwners(search?: string): Promise<OwnerListItem[]> {
  await requireAdmin();
  const q = search?.trim();

  const owners = await prisma.user.findMany({
    where: {
      role: "RESTAURANT_OWNER",
      ...(q
        ? {
            OR: [
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { phoneNumber: { contains: q, mode: "insensitive" } },
              { restaurant: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, firstName: true, lastName: true, email: true, username: true,
      phoneNumber: true, profileImage: true, isActive: true, isVerified: true,
      identityDocType: true, createdAt: true, lastLoginAt: true,
      restaurant: { select: { id: true, name: true, isActive: true } },
    },
  });

  // Fill in restaurants for owners linked only through Restaurant.ownerId.
  const missing = owners.filter((o) => !o.restaurant).map((o) => o.id);
  const ownedByMap = new Map<string, { id: string; name: string; isActive: boolean }>();
  if (missing.length) {
    const owned = await prisma.restaurant.findMany({
      where: { ownerId: { in: missing } },
      select: { id: true, name: true, isActive: true, ownerId: true },
    });
    for (const r of owned) if (r.ownerId) ownedByMap.set(r.ownerId, { id: r.id, name: r.name, isActive: r.isActive });
  }

  return owners.map((o) => ({
    id: o.id,
    firstName: o.firstName,
    lastName: o.lastName,
    email: o.email,
    username: o.username,
    phoneNumber: o.phoneNumber,
    profileImage: o.profileImage,
    isActive: o.isActive,
    isVerified: o.isVerified,
    identityDocType: o.identityDocType,
    createdAt: o.createdAt.toISOString(),
    lastLoginAt: o.lastLoginAt ? o.lastLoginAt.toISOString() : null,
    restaurant: o.restaurant ?? ownedByMap.get(o.id) ?? null,
  }));
}

/** Full profile + identity/KYC detail for one owner. */
export async function getOwnerDetail(userId: string): Promise<{ data: OwnerDetail } | { error: string }> {
  await requireAdmin();
  try {
    const u = await prisma.user.findFirst({
      where: { id: userId, role: "RESTAURANT_OWNER" },
      select: {
        id: true, firstName: true, lastName: true, email: true, username: true,
        phoneNumber: true, profileImage: true, isActive: true, isVerified: true,
        identityDocType: true, identityDocNumber: true, identityDocImage: true,
        identityDocBackImage: true, dateOfBirth: true, address: true,
        verifiedAt: true, adminNotes: true, createdAt: true, lastLoginAt: true,
        restaurantId: true,
        restaurant: { select: { id: true, name: true, isActive: true } },
      },
    });
    if (!u) return { error: "Owner not found" };

    let restaurant = u.restaurant;
    if (!restaurant) {
      restaurant = await prisma.restaurant.findFirst({
        where: { ownerId: userId },
        select: { id: true, name: true, isActive: true },
      });
    }

    return {
      data: {
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        username: u.username,
        phoneNumber: u.phoneNumber,
        profileImage: u.profileImage,
        isActive: u.isActive,
        isVerified: u.isVerified,
        identityDocType: u.identityDocType,
        identityDocNumber: u.identityDocNumber,
        identityDocImage: u.identityDocImage,
        identityDocBackImage: u.identityDocBackImage,
        dateOfBirth: u.dateOfBirth ? u.dateOfBirth.toISOString().slice(0, 10) : null,
        address: u.address,
        verifiedAt: u.verifiedAt ? u.verifiedAt.toISOString() : null,
        adminNotes: u.adminNotes,
        createdAt: u.createdAt.toISOString(),
        lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
        restaurant,
      },
    };
  } catch (err: any) {
    return { error: err?.message || "Failed to load owner" };
  }
}

export async function updateOwnerProfile(
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    dateOfBirth?: string | null;
    address?: string | null;
    profileImage?: string | null;
  }
) {
  const session = await requireAdmin();
  const owner = await loadOwner(userId);
  if (!owner) return { error: "Owner not found" };

  try {
    const update: Record<string, any> = {};
    if (data.firstName !== undefined) update.firstName = data.firstName.trim();
    if (data.lastName !== undefined) update.lastName = data.lastName.trim();
    if (data.email !== undefined) {
      const email = data.email.trim().toLowerCase();
      if (!email) return { error: "Email is required" };
      update.email = email;
    }
    if (data.phoneNumber !== undefined) update.phoneNumber = data.phoneNumber.trim() || null;
    if (data.dateOfBirth !== undefined) update.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
    if (data.address !== undefined) update.address = data.address?.trim() || null;
    if (data.profileImage !== undefined) update.profileImage = data.profileImage || null;

    await prisma.user.update({ where: { id: userId }, data: update });

    await logActivity(session, {
      restaurantId: await resolveOwnerRestaurantId(userId, owner.restaurantId),
      actionType: "OWNER_PROFILE_UPDATE",
      entityType: "User",
      entityId: userId,
      description: `Owner profile updated by platform admin`,
    });
    return { success: true };
  } catch (err: any) {
    if (err?.code === "P2002") return { error: "That email is already in use by another account" };
    return { error: err?.message || "Failed to update profile" };
  }
}

export async function updateOwnerIdentity(
  userId: string,
  data: {
    identityDocType?: string;
    identityDocNumber?: string | null;
    identityDocImage?: string | null;
    identityDocBackImage?: string | null;
  }
) {
  const session = await requireAdmin();
  const owner = await loadOwner(userId);
  if (!owner) return { error: "Owner not found" };

  try {
    const update: Record<string, any> = {};
    if (data.identityDocType !== undefined) update.identityDocType = data.identityDocType;
    if (data.identityDocNumber !== undefined) update.identityDocNumber = data.identityDocNumber?.trim() || null;
    if (data.identityDocImage !== undefined) update.identityDocImage = data.identityDocImage || null;
    if (data.identityDocBackImage !== undefined) update.identityDocBackImage = data.identityDocBackImage || null;

    await prisma.user.update({ where: { id: userId }, data: update });

    await logActivity(session, {
      restaurantId: await resolveOwnerRestaurantId(userId, owner.restaurantId),
      actionType: "OWNER_IDENTITY_UPDATE",
      entityType: "User",
      entityId: userId,
      description: `Owner identity documents updated by platform admin`,
    });
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "Failed to update identity documents" };
  }
}

/** Mark an owner's identity as verified (KYC) or clear that verification. */
export async function setOwnerVerified(userId: string, verified: boolean) {
  const session = await requireAdmin();
  const owner = await loadOwner(userId);
  if (!owner) return { error: "Owner not found" };

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        isVerified: verified,
        verifiedAt: verified ? new Date() : null,
        verifiedBy: verified ? session.id : null,
      },
    });

    await logActivity(session, {
      restaurantId: await resolveOwnerRestaurantId(userId, owner.restaurantId),
      actionType: verified ? "OWNER_VERIFIED" : "OWNER_UNVERIFIED",
      entityType: "User",
      entityId: userId,
      description: `Owner identity ${verified ? "verified" : "verification revoked"} by platform admin`,
    });
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "Failed to update verification" };
  }
}

/** Set a new login password for the owner (bcrypt, 6-char min — matches auth.ts). */
export async function setOwnerPassword(userId: string, newPassword: string) {
  const session = await requireAdmin();
  if (!newPassword || newPassword.length < 6) {
    return { error: "New password must be at least 6 characters" };
  }
  const owner = await loadOwner(userId);
  if (!owner) return { error: "Owner not found" };

  try {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    await logActivity(session, {
      restaurantId: await resolveOwnerRestaurantId(userId, owner.restaurantId),
      actionType: "OWNER_PASSWORD_RESET",
      entityType: "User",
      entityId: userId,
      description: `Owner login password reset by platform admin`,
    });
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "Failed to reset password" };
  }
}

/** Activate/deactivate an owner's login. A deactivated owner is refused by login(). */
export async function setOwnerActive(userId: string, isActive: boolean) {
  const session = await requireAdmin();
  const owner = await loadOwner(userId);
  if (!owner) return { error: "Owner not found" };

  try {
    await prisma.user.update({ where: { id: userId }, data: { isActive } });

    await logActivity(session, {
      restaurantId: await resolveOwnerRestaurantId(userId, owner.restaurantId),
      actionType: isActive ? "OWNER_ACTIVATED" : "OWNER_DEACTIVATED",
      entityType: "User",
      entityId: userId,
      description: `Owner login ${isActive ? "reactivated" : "deactivated"} by platform admin`,
    });
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "Failed to update owner status" };
  }
}

export async function updateOwnerNotes(userId: string, notes: string) {
  const session = await requireAdmin();
  const owner = await loadOwner(userId);
  if (!owner) return { error: "Owner not found" };

  try {
    await prisma.user.update({ where: { id: userId }, data: { adminNotes: notes.trim() || null } });

    await logActivity(session, {
      restaurantId: await resolveOwnerRestaurantId(userId, owner.restaurantId),
      actionType: "OWNER_NOTES_UPDATE",
      entityType: "User",
      entityId: userId,
      description: `Owner admin notes updated`,
    });
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "Failed to save notes" };
  }
}
