"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/**
 * Returns unread notifications for whoever is signed in on the CURRENT portal
 * (owner / reception / waiter / superadmin — getSession resolves the portal
 * from the request path). Used by the global notification-sound system so an
 * audible ring fires on every page for every role. Also returns `serverNow`
 * so the client can baseline against server time (avoids client clock skew)
 * and `userId` so it can key its per-user "already alerted" watermark.
 */
export async function getMyUnreadNotifications() {
  const session = await getSession();
  if (!session?.id) {
    return { userId: null as string | null, serverNow: Date.now(), notifications: [] };
  }

  // Superadmins have no per-user rows in the Notification table (those all
  // belong to a restaurant). Their meaningful live alert is a new support
  // ticket, so surface open tickets in the same notification shape — the
  // client's timestamp watermark makes it ring only for tickets that arrive
  // after the console was opened.
  if (session.role === "SUPER_ADMIN" || session.role === "ADMIN") {
    const tickets = await prisma.supportTicket.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        subject: true,
        createdAt: true,
        restaurant: { select: { name: true } },
      },
    });
    return {
      userId: session.id,
      serverNow: Date.now(),
      notifications: tickets.map((t) => ({
        id: t.id,
        type: "SUPPORT_TICKET",
        title: "New support ticket",
        message: t.restaurant?.name ? `${t.restaurant.name}: ${t.subject}` : t.subject,
        createdAt: t.createdAt,
        actionUrl: "/superadmin/support" as string | null,
        relatedEntityType: "SupportTicket" as string | null,
      })),
    };
  }

  const notifications = await prisma.notification.findMany({
    where: { recipientUserId: session.id, isRead: false },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      type: true,
      title: true,
      message: true,
      createdAt: true,
      // Drive the alert popup's "View Order" button: an explicit actionUrl when
      // one was set, otherwise the client routes by entity type per portal.
      actionUrl: true,
      relatedEntityType: true,
    },
  });

  return { userId: session.id, serverNow: Date.now(), notifications };
}

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
      // Needed by the bell panel's "View" button to route to the right screen.
      actionUrl: true,
      relatedEntityType: true,
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
