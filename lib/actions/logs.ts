"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export type LogEntry = {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  actionType: string;
  entityType: string;
  entityId: string;
  description: string;
  changesBefore: Record<string, unknown> | null;
  changesAfter: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
};

function getDateRange(period: string) {
  const now = new Date();
  let start: Date;
  const end = new Date(now);

  switch (period) {
    case "day":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week": {
      const dayOfWeek = now.getDay();
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
      break;
    }
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "year":
      start = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function getLogs(period: string = "month") {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated", data: [] as LogEntry[] };

  try {
    const { start, end } = getDateRange(period);

    const [logs, users] = await Promise.all([
      prisma.activityLog.findMany({
        where: {
          restaurantId: session.restaurantId,
          createdAt: { gte: start, lte: end },
        },
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
      prisma.user.findMany({
        where: { restaurantId: session.restaurantId },
        select: { id: true, firstName: true, lastName: true, role: true },
      }),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));

    const data: LogEntry[] = logs.map((log) => {
      const user = userMap.get(log.userId);
      return {
        id: log.id,
        userId: log.userId,
        userName: user ? `${user.firstName} ${user.lastName}`.trim() || "Unknown" : "Unknown",
        userRole: user?.role || "UNKNOWN",
        actionType: log.actionType,
        entityType: log.entityType,
        entityId: log.entityId,
        description: log.description,
        changesBefore: (log.changesBefore as Record<string, unknown>) || null,
        changesAfter: (log.changesAfter as Record<string, unknown>) || null,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt.toISOString(),
      };
    });

    return { data };
  } catch (err: any) {
    return { error: err?.message || "Failed to load logs", data: [] as LogEntry[] };
  }
}
