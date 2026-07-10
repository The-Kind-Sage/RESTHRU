"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Order lifecycle: PENDING → PREPARING → READY → SERVED (+ Bill = closed)
// CANCELLED is allowed from PENDING/PREPARING only.
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED", "PENDING"], // PENDING allows kitchen undo
  READY: ["SERVED", "PREPARING"], // PREPARING allows kitchen undo
  SERVED: [],
  CANCELLED: [],
};

/** Frees the table if this order is the one occupying it. */
async function releaseTableForOrder(tx: any, order: { id: string; tableId: string | null }) {
  if (!order.tableId) return;
  const table = await tx.restaurantTable.findUnique({ where: { id: order.tableId } });
  if (table?.currentOrderId === order.id) {
    // Only free the table when it has no other open orders
    const otherOpen = await tx.order.findFirst({
      where: {
        tableId: order.tableId,
        id: { not: order.id },
        status: { in: ["PENDING", "PREPARING", "READY"] },
      },
      select: { id: true },
    });
    await tx.restaurantTable.update({
      where: { id: order.tableId },
      data: otherOpen
        ? { currentOrderId: otherOpen.id }
        : { status: "AVAILABLE", currentOrderId: null, occupiedSince: null, assignedWaiterId: null },
    });
  }
}

/** Notifies the assigned waiter, or every active waiter/staff member if unassigned. */
async function notifyServers(
  restaurantId: string,
  order: { id: string; orderId: string; assignedWaiterId: string | null },
  title: string,
  message: string,
  type: string
) {
  let recipientIds: string[];
  if (order.assignedWaiterId) {
    recipientIds = [order.assignedWaiterId];
  } else {
    // Roles are inconsistent across the app (OWNER/STAFF/WAITER/…), so notify
    // everyone active at the restaurant except kitchen staff and platform admins.
    const servers = await prisma.user.findMany({
      where: { restaurantId, role: { notIn: ["KITCHEN", "ADMIN", "SUPER_ADMIN"] }, isActive: true },
      select: { id: true },
    });
    recipientIds = servers.map((s) => s.id);
  }
  if (recipientIds.length === 0) return;

  await prisma.notification.createMany({
    data: recipientIds.map((id) => ({
      recipientUserId: id,
      restaurantId,
      type,
      title,
      message,
      relatedEntityId: order.id,
      relatedEntityType: "Order",
    })),
  });
}

export async function createOrder(data: {
  draftItems: Array<{ menuItem: { id: string, name: string, price: number }, quantity: number, notes?: string }>;
  tableNumber: string | null;
  guestCount: number;
}) {
  const session = await getSession();
  if (!session || !session.restaurantId) {
    return { error: "Not authenticated" };
  }
  const restaurantId = session.restaurantId;

  try {
    // Verify items against the menu in one query; recompute prices server-side
    const menuItemIds = data.draftItems.map((i) => i.menuItem.id);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, restaurantId, isAvailable: true },
    });
    const menuById = new Map(menuItems.map((m) => [m.id, m]));

    let subtotal = 0;
    const itemsToCreate: {
      menuItemId: string;
      menuItemName: string;
      quantity: number;
      pricePerUnit: number;
      specialInstructions: string | null;
      status: string;
    }[] = [];
    const unavailable: string[] = [];

    for (const item of data.draftItems) {
      const menuItem = menuById.get(item.menuItem.id);
      if (!menuItem) {
        unavailable.push(item.menuItem.name);
        continue;
      }
      if (item.quantity < 1) continue;

      const price = menuItem.discountPrice ?? menuItem.price;
      subtotal += price * item.quantity;

      itemsToCreate.push({
        menuItemId: menuItem.id,
        menuItemName: menuItem.name,
        quantity: item.quantity,
        pricePerUnit: price,
        specialInstructions: item.notes || null,
        status: "PENDING",
      });
    }

    if (itemsToCreate.length === 0) {
      return {
        error: unavailable.length > 0
          ? `These items are no longer available: ${unavailable.join(", ")}`
          : "No valid items in order.",
      };
    }

    // Resolve the table — required for dine-in so the kitchen knows where food goes
    let table: Awaited<ReturnType<typeof prisma.restaurantTable.findUnique>> = null;
    if (data.tableNumber) {
      const tableNum = parseInt(data.tableNumber, 10);
      if (!isNaN(tableNum)) {
        table = await prisma.restaurantTable.findUnique({
          where: {
            restaurantId_tableNumber: { restaurantId, tableNumber: tableNum },
          },
        });
      }
      if (!table) {
        return { error: `Table ${data.tableNumber} does not exist. Please pick a table from the list.` };
      }
    }

    // Friendly order number: continue from the restaurant's latest order
    const lastOrder = await prisma.order.findFirst({
      where: { restaurantId },
      orderBy: { createdAt: "desc" },
      select: { orderId: true },
    });
    const lastNumber = parseInt(lastOrder?.orderId ?? "", 10);
    let nextNumber = isNaN(lastNumber) ? 1001 : lastNumber + 1;

    const taxAmount = subtotal * 0.13; // 13% VAT (Nepal)
    const totalAmount = subtotal + taxAmount;

    // Retry on orderId collision from concurrent order creation
    let order;
    for (let attempt = 0; ; attempt++) {
      try {
        order = await prisma.$transaction(async (tx) => {
          const created = await tx.order.create({
            data: {
              restaurantId,
              tableId: table?.id ?? null,
              orderId: nextNumber.toString(),
              orderType: table ? "DINE_IN" : "TAKEAWAY",
              status: "PENDING",
              subtotal,
              taxAmount,
              totalAmount,
              assignedWaiterId: session.id,
              items: { create: itemsToCreate },
            },
            include: { items: true },
          });

          // Occupy the table while it has an open order
          if (table) {
            await tx.restaurantTable.update({
              where: { id: table.id },
              data: {
                status: "OCCUPIED",
                currentOrderId: created.id,
                occupiedSince: table.status === "OCCUPIED" ? table.occupiedSince : new Date(),
                assignedWaiterId: session.id,
              },
            });
          }
          return created;
        });
        break;
      } catch (err: any) {
        if (err?.code === "P2002" && attempt < 5) {
          nextNumber++;
          continue;
        }
        throw err;
      }
    }

    if (unavailable.length > 0) {
      return { data: order, warning: `Skipped unavailable items: ${unavailable.join(", ")}` };
    }
    return { data: order };
  } catch (err: any) {
    console.error("Failed to create order:", err);
    return { error: err?.message || "Failed to create order" };
  }
}

export async function getKitchenOrders() {
  const session = await getSession();
  if (!session || !session.restaurantId) {
    return { error: "Not authenticated" };
  }

  try {
    const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000); // keep READY visible for 12h max
    const orders = await prisma.order.findMany({
      where: {
        restaurantId: session.restaurantId,
        OR: [
          { status: { in: ["PENDING", "PREPARING"] } },
          { status: "READY", updatedAt: { gte: cutoff } },
        ],
      },
      include: {
        items: true,
        table: { select: { tableNumber: true } },
      },
      orderBy: { createdAt: "asc" }, // oldest first — kitchen works FIFO
    });

    return { data: orders };
  } catch (err: any) {
    return { error: err?.message || "Failed to fetch kitchen orders" };
  }
}

/** Active orders for the waiter view: everything not yet served/cancelled, plus served-but-unbilled. */
export async function getActiveOrders() {
  const session = await getSession();
  if (!session || !session.restaurantId) {
    return { error: "Not authenticated" };
  }

  try {
    const orders = await prisma.order.findMany({
      where: {
        restaurantId: session.restaurantId,
        OR: [
          { status: { in: ["PENDING", "PREPARING", "READY"] } },
          { status: "SERVED", bills: { none: {} } },
        ],
      },
      include: {
        items: true,
        table: { select: { tableNumber: true } },
        bills: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return { data: orders };
  } catch (err: any) {
    return { error: err?.message || "Failed to fetch active orders" };
  }
}

export async function updateOrderStatus(orderId: string, status: string) {
  const session = await getSession();
  if (!session || !session.restaurantId) {
    return { error: "Not authenticated" };
  }

  try {
    const existing = await prisma.order.findFirst({
      where: { id: orderId, restaurantId: session.restaurantId },
      select: { id: true, status: true, tableId: true },
    });
    if (!existing) return { error: "Order not found" };

    if (!VALID_TRANSITIONS[existing.status]?.includes(status)) {
      return { error: `Cannot change order from ${existing.status} to ${status}` };
    }

    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status,
          updatedAt: new Date(),
          ...(status === "SERVED" ? { completedAt: new Date() } : {}),
          ...(status === "PREPARING" && existing.status === "READY" ? { completedAt: null } : {}),
        },
        include: { table: true },
      });

      // Cancelling releases the table (if no other open orders on it)
      if (status === "CANCELLED") {
        await releaseTableForOrder(tx, updated);
        await tx.orderItem.updateMany({
          where: { orderId },
          data: { status: "CANCELLED" },
        });
      }
      if (status === "SERVED") {
        await tx.orderItem.updateMany({
          where: { orderId, status: { not: "CANCELLED" } },
          data: { status: "SERVED", servedAt: new Date() },
        });
      }
      return updated;
    });

    // When food is READY, alert whoever is serving
    if (status === "READY") {
      const tableLabel = (order as any).table?.tableNumber
        ? `Table ${(order as any).table.tableNumber}`
        : order.orderType;
      await notifyServers(
        session.restaurantId,
        order,
        "🍽️ Food Ready!",
        `Order #${order.orderId} (${tableLabel}) is ready to serve.`,
        "ORDER_READY"
      );
    }

    return { data: order };
  } catch (err: any) {
    return { error: err?.message || "Failed to update order status" };
  }
}

/**
 * Settles an order: creates the bill, marks the order SERVED (if not already),
 * and frees the table. This is the step that closes an order in the real flow.
 */
export async function settleOrder(data: {
  orderId: string;
  paymentMethod: "CASH" | "ESEWA" | "KHALTI" | "FONEPAY";
  amountPaid?: number;
  discountAmount?: number;
  discountReason?: string;
  paymentRef?: string;
}) {
  const session = await getSession();
  if (!session || !session.restaurantId) {
    return { error: "Not authenticated" };
  }
  const restaurantId = session.restaurantId;

  try {
    const order = await prisma.order.findFirst({
      where: { id: data.orderId, restaurantId },
      include: { bills: { select: { id: true } } },
    });
    if (!order) return { error: "Order not found" };
    if (order.status === "CANCELLED") return { error: "Cannot bill a cancelled order" };
    if (order.status === "PENDING" || order.status === "PREPARING") {
      return { error: "Order is still in the kitchen. Serve it before billing." };
    }
    if (order.bills.length > 0) return { error: "This order has already been billed" };

    const discount = Math.min(Math.max(data.discountAmount ?? 0, 0), order.subtotal);
    const totalAmount = order.subtotal + order.taxAmount + order.serviceCharge - discount;
    const amountPaid = data.amountPaid ?? totalAmount;
    if (amountPaid < totalAmount - 0.01) {
      return { error: `Amount paid (${amountPaid}) is less than the total (${totalAmount.toFixed(2)})` };
    }

    // Sequential bill number per restaurant
    const lastBill = await prisma.bill.findFirst({
      where: { restaurantId },
      orderBy: { createdAt: "desc" },
      select: { billNumber: true },
    });
    const lastBillNum = parseInt(lastBill?.billNumber?.replace(/\D/g, "") ?? "", 10);
    let nextBillNumber = isNaN(lastBillNum) ? 1 : lastBillNum + 1;

    let bill;
    for (let attempt = 0; ; attempt++) {
      try {
        bill = await prisma.$transaction(async (tx) => {
          const created = await tx.bill.create({
            data: {
              restaurantId,
              orderId: order.id,
              billNumber: `B-${nextBillNumber.toString().padStart(5, "0")}`,
              subtotal: order.subtotal,
              taxAmount: order.taxAmount,
              serviceCharge: order.serviceCharge,
              discountAmount: discount,
              totalAmount,
              amountPaid,
              change: amountPaid - totalAmount,
              paymentMethod: data.paymentMethod,
              paymentRef: data.paymentRef || null,
              settledAt: new Date(),
              createdBy: session.id,
            },
          });

          await tx.order.update({
            where: { id: order.id },
            data: {
              status: "SERVED",
              discountAmount: discount,
              discountReason: data.discountReason || order.discountReason,
              totalAmount,
              completedAt: order.completedAt ?? new Date(),
            },
          });

          await releaseTableForOrder(tx, order);
          return created;
        });
        break;
      } catch (err: any) {
        if (err?.code === "P2002" && attempt < 5) {
          nextBillNumber++;
          continue;
        }
        throw err;
      }
    }

    return { data: bill };
  } catch (err: any) {
    console.error("Failed to settle order:", err);
    return { error: err?.message || "Failed to settle order" };
  }
}

/**
 * Fetches unread ORDER_READY notifications for the currently logged-in user.
 * Called by the /order page on a polling interval so waiters see food-ready alerts.
 */
export async function getReadyOrderNotifications() {
  const session = await getSession();
  if (!session || !session.id) {
    return { error: "Not authenticated" };
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: {
        recipientUserId: session.id,
        type: "ORDER_READY",
        isRead: false,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        message: true,
        createdAt: true,
        relatedEntityId: true,
      },
    });
    return { data: notifications };
  } catch (err: any) {
    return { error: err?.message || "Failed to fetch notifications" };
  }
}

/**
 * Marks a batch of ORDER_READY notifications as read.
 * Called after displaying toasts so they don't re-appear on the next poll.
 */
export async function markNotificationsRead(ids: string[]) {
  const session = await getSession();
  if (!session || !session.id) return { error: "Not authenticated" };

  try {
    await prisma.notification.updateMany({
      where: { id: { in: ids }, recipientUserId: session.id },
      data: { isRead: true, readAt: new Date() },
    });
    return { data: true };
  } catch (err: any) {
    return { error: err?.message || "Failed to mark notifications read" };
  }
}
