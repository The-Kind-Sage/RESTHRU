"use server";

import prisma from "@/lib/prisma";

export async function getNotifications(restaurantId: string) {
  return prisma.notification.findMany({
    where: { restaurantId },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      type: true,
      title: true,
      message: true,
      isRead: true,
      createdAt: true,
    },
  });
}

export async function markNotificationRead(id: string) {
  await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
}

export async function markAllNotificationsRead(restaurantId: string) {
  await prisma.notification.updateMany({
    where: { restaurantId, isRead: false },
    data: { isRead: true },
  });
}
