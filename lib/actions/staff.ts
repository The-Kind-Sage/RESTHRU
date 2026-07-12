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

export async function addStaff(data: {
  restaurantId: string;
  name: string;
  role: string;
  phone: string;
  email?: string;
  avatarUrl?: string | null;
}) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  // Enforce the plan's staff cap before inserting.
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
        salary: 0,
      },
    });
    return { data: member };
  } catch (err: any) {
    return { error: err?.message || "Failed to add staff member" };
  }
}
