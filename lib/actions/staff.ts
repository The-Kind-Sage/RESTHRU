"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { checkResourceLimit, limitMessage } from "@/lib/plan-guard";

export async function getStaff(restaurantId: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    const members = await prisma.staff.findMany({
      where: { restaurantId, isActive: true },
      orderBy: { createdAt: "desc" },
    });
    return { data: members };
  } catch (err: any) {
    return { error: err?.message || "Failed to load staff" };
  }
}

interface StaffInput {
  restaurantId?: string;
  name: string;
  role: string;
  phone: string;
  email?: string;
  avatarUrl?: string | null;
  address?: string;
  dateOfBirth?: string | null;
  identityDocType?: string;
  identityDocImage?: string | null;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodGroup?: string;
  salary?: number;
}

export async function addStaff(data: StaffInput & { restaurantId: string }) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  const limitReached = await checkResourceLimit(data.restaurantId, "staff");
  if (limitReached) return { error: limitMessage(limitReached), limitReached };

  try {
    const member = await prisma.staff.create({
      data: {
        restaurantId: data.restaurantId,
        firstName: data.name,
        role: data.role.toUpperCase(),
        phoneNumber: data.phone,
        email: data.email || "",
        profileImage: data.avatarUrl || undefined,
        address: data.address || undefined,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        identityDocType: data.identityDocType || "",
        identityDocImage: data.identityDocImage || undefined,
        emergencyContactName: data.emergencyContactName || "",
        emergencyContactPhone: data.emergencyContactPhone || "",
        bloodGroup: data.bloodGroup || "",
        salary: data.salary || 0,
      },
    });
    return { data: member };
  } catch (err: any) {
    return { error: err?.message || "Failed to add staff member" };
  }
}

export async function updateStaff(data: StaffInput & { id: string }) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    const member = await prisma.staff.update({
      where: { id: data.id },
      data: {
        firstName: data.name,
        role: data.role.toUpperCase(),
        phoneNumber: data.phone,
        email: data.email || "",
        profileImage: data.avatarUrl || undefined,
        address: data.address || undefined,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        identityDocType: data.identityDocType || "",
        identityDocImage: data.identityDocImage || undefined,
        emergencyContactName: data.emergencyContactName || "",
        emergencyContactPhone: data.emergencyContactPhone || "",
        bloodGroup: data.bloodGroup || "",
        salary: data.salary ?? undefined,
      },
    });
    return { data: member };
  } catch (err: any) {
    return { error: err?.message || "Failed to update staff member" };
  }
}

export async function deleteStaff(staffId: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    await prisma.staff.delete({ where: { id: staffId } });
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "Failed to delete staff member" };
  }
}
