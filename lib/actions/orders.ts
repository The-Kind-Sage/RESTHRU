"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "./logs";
import { verifyManagerApproval } from "@/lib/manager-approval";
import { splitVatInclusive, NEPAL_VAT_RATE } from "@/lib/vat";
import { fiscalYearBs } from "@/lib/nepali-date";
import { newTableToken } from "@/lib/table-token";

const SELF_VOID_ROLES = ["RECEPTIONIST", "MANAGER", "RESTAURANT_OWNER", "ADMIN", "SUPER_ADMIN"];

/** Looks up the restaurant's default effective tax rate (TaxRate model > restaurant.taxPercentage > 13%). */
export async function getEffectiveTaxRate(restaurantId: string): Promise<number> {
  try {
    const defaultRate = await prisma.taxRate.findFirst({
      where: { restaurantId, isDefault: true, isActive: true },
      select: { rate: true },
    });
    if (defaultRate) return defaultRate.rate;
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { taxPercentage: true },
    });
    return restaurant?.taxPercentage ?? 13;
  } catch {
    return 13;
  }
}

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
        : {
            status: "AVAILABLE",
            currentOrderId: null,
            occupiedSince: null,
            assignedWaiterId: null,
            // The party has paid and left: rotate the QR token so the link they
            // scanned can't be used to order again once they're gone.
            qrCode: newTableToken(),
          },
    });
  }
}

/** Notifies the assigned waiter, or every active waiter/staff member if unassigned. */
export async function notifyServers(
  restaurantId: string,
  order: { id: string; orderId: string; assignedWaiterId: string | null },
  title: string,
  message: string,
  type: string,
  opts?: {
    /** Where the notification's "View" button should take the recipient. */
    actionUrl?: string;
    /** Never notify this user — used so the person who just acted isn't pinged. */
    excludeUserId?: string;
    /** Alert the whole front of house even when the order has an assigned waiter. */
    notifyAll?: boolean;
  }
) {
  let recipientIds: string[];
  if (order.assignedWaiterId && !opts?.notifyAll) {
    recipientIds = [order.assignedWaiterId];
  } else {
    // Don't notify owners about ORDER_READY — they don't need to hear every
    // "food ready" ring. Keep all other types flowing to everyone active.
    const excludeRoles = type === "ORDER_READY"
      ? ["KITCHEN", "ADMIN", "SUPER_ADMIN", "OWNER"]
      : ["KITCHEN", "ADMIN", "SUPER_ADMIN"];
    const servers = await prisma.user.findMany({
      where: { restaurantId, role: { notIn: excludeRoles }, isActive: true },
      select: { id: true },
    });
    recipientIds = servers.map((s) => s.id);
  }
  if (opts?.excludeUserId) {
    recipientIds = recipientIds.filter((id) => id !== opts.excludeUserId);
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
      actionUrl: opts?.actionUrl ?? null,
    })),
  });
}

const TABLE_ORDER_TYPES = ["DINE_IN"];

export async function createOrder(data: {
  draftItems: Array<{ menuItem: { id: string, name: string, price: number }, quantity: number, notes?: string }>;
  tableNumber: string | null;
  guestCount: number;
  /** DINE_IN | TAKEAWAY | DELIVERY | PICKUP. Defaults by table presence. */
  orderType?: string;
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

    // Honour the caller's order type; fall back to the old table-presence rule
    // for callers that don't send one.
    const orderType = (data.orderType || (data.tableNumber ? "DINE_IN" : "TAKEAWAY")).toUpperCase();
    const takesTable = TABLE_ORDER_TYPES.includes(orderType);

    // Resolve the table — only dine-in sits at one. Ignoring it otherwise stops
    // a delivery/takeaway order inheriting a stale table and occupying it.
    let table: Awaited<ReturnType<typeof prisma.restaurantTable.findUnique>> = null;
    if (takesTable && data.tableNumber) {
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

    // No VAT/tax is added — the order total is exactly the sum of menu prices.
    const taxAmount = 0;
    const totalAmount = subtotal;

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
              orderType,
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

    await logActivity(session, {
      actionType: "ORDER_CREATE",
      entityType: "Order",
      entityId: order.id,
      description: `Order ${order.orderId} created for table ${data.tableNumber} (${data.draftItems.length} items)`,
    });

    // Ring the front of house (owner/reception/other waiters) for the new order.
    // `notifyAll` overrides the assigned-waiter shortcut — the creator assigns
    // themselves, so without it nobody but them would ever hear about it — and
    // `excludeUserId` keeps the person who just tapped "send" from self-pinging.
    // Best-effort: the order is already committed, so a failure here isn't fatal.
    try {
      const whereLabel = data.tableNumber ? `Table ${data.tableNumber}` : "Takeaway";
      await notifyServers(
        restaurantId,
        order,
        "New Order Request",
        `Order #${order.orderId} added from ${whereLabel} — ${itemsToCreate.length} item${itemsToCreate.length !== 1 ? "s" : ""}, Rs ${totalAmount}`,
        "NEW_ORDER",
        { notifyAll: true, excludeUserId: session.id }
      );
    } catch (notifyErr) {
      console.error("Failed to notify staff of new order:", notifyErr);
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
        items: {
          include: {
            menuItem: { select: { imageUrl: true } },
          },
        },
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

    await logActivity(session, {
      actionType: "ORDER_STATUS_UPDATE",
      entityType: "Order",
      entityId: orderId,
      description: `Order status updated to ${status}`,
    });

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
  /**
   * Counter sale: the guest pays up front, so the order is billed the moment
   * it's raised instead of after it has been cooked and served.
   */
  quickBill?: boolean;
}) {
  const session = await getSession();
  if (!session || !session.restaurantId) {
    return { error: "Not authenticated" };
  }
  const restaurantId = session.restaurantId;

  try {
    // Order lookup and bill-number lookup are independent — run them together
    // so the checkout tap pays one DB round-trip instead of two.
    const [order, lastBill, restaurant] = await Promise.all([
      prisma.order.findFirst({
        where: { id: data.orderId, restaurantId },
        include: { bills: { select: { id: true } } },
      }),
      prisma.bill.findFirst({
        where: { restaurantId },
        orderBy: { createdAt: "desc" },
        select: { billNumber: true },
      }),
      prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: { vatRegistered: true, taxPercentage: true },
      }),
    ]);
    if (!order) return { error: "Order not found" };
    if (order.status === "CANCELLED") return { error: "Cannot bill a cancelled order" };
    if (!data.quickBill && (order.status === "PENDING" || order.status === "PREPARING")) {
      return { error: "Order is still in the kitchen. Serve it before billing." };
    }
    if (order.bills.length > 0) return { error: "This order has already been billed" };

    const discount = Math.min(Math.max(data.discountAmount ?? 0, 0), order.subtotal);
    // Menu-inclusive total (courts bar adding VAT on top); the 13% VAT component
    // is back-calculated from this gross for VAT-registered restaurants.
    const totalAmount = order.subtotal + order.serviceCharge - discount;
    const { taxable, vat } = restaurant?.vatRegistered
      ? splitVatInclusive(totalAmount, restaurant.taxPercentage || NEPAL_VAT_RATE)
      : { taxable: totalAmount, vat: 0 };
    const amountPaid = data.amountPaid ?? totalAmount;
    if (amountPaid < totalAmount - 0.01) {
      return { error: `Amount paid (${amountPaid}) is less than the total (${totalAmount.toFixed(2)})` };
    }
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
              taxableAmount: taxable,
              taxAmount: vat,
              serviceCharge: order.serviceCharge,
              discountAmount: discount,
              totalAmount,
              amountPaid,
              change: amountPaid - totalAmount,
              paymentMethod: data.paymentMethod,
              paymentRef: data.paymentRef || null,
              status: "PAID",
              settledAt: new Date(),
              // Issued in full immediately, so lock it and stamp the BS fiscal year.
              isLocked: true,
              fiscalYear: fiscalYearBs(new Date()),
              createdBy: session.id,
            },
          });

          await tx.payment.create({
            data: {
              billId: created.id,
              method: data.paymentMethod,
              amount: amountPaid,
              reference: data.paymentRef || null,
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

    await logActivity(session, {
      actionType: "ORDER_SETTLE",
      entityType: "Order",
      entityId: order.id,
      description: `Order ${order.orderId} settled`,
    });

    // Mirror the checkout flow: a settled order produces a fully-paid bill, so
    // record a "completed" entry the owner can scan in the activity log.
    await logActivity(session, {
      actionType: "BILL_COMPLETED",
      entityType: "Bill",
      entityId: bill.id,
      description: `Bill ${bill.billNumber} completed — total ${totalAmount} paid in full via ${data.paymentMethod}`,
    });

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

/** Recomputes subtotal/total from an order's non-cancelled items. No VAT is added — totals are plain menu prices. */
function recomputeOrderTotals(items: { pricePerUnit: number; quantity: number; status: string }[], serviceCharge: number, discountAmount: number) {
  const subtotal = items
    .filter((i) => i.status !== "CANCELLED")
    .reduce((s, i) => s + i.pricePerUnit * i.quantity, 0);
  const taxAmount = 0;
  const discount = Math.min(Math.max(discountAmount, 0), subtotal);
  const totalAmount = subtotal + serviceCharge - discount;
  return { subtotal, taxAmount, totalAmount, discount };
}

/**
 * Voids a single order item (e.g. kitchen mistake, guest changed their mind) and
 * recomputes the order's totals. Requires a manager/owner/admin to authorize with
 * their own credentials. Only allowed before the order has been paid.
 */
export async function voidOrderItem(data: {
  orderItemId: string;
  reason: string;
  approverUsername?: string;
  approverPassword?: string;
}) {
  const session = await getSession();
  if (!session || !session.restaurantId) return { error: "Not authenticated" };
  if (!data.reason?.trim()) return { error: "A void reason is required" };

  try {
    const wantsApproval = !!(data.approverUsername?.trim() && data.approverPassword);

    let voidedById = session.id;
    let approvalNote = "self-authorized";

    if (wantsApproval) {
      const approval = await verifyManagerApproval(
        session.restaurantId,
        data.approverUsername!.trim(),
        data.approverPassword!
      );
      if (!approval.ok) return { error: approval.error };
      voidedById = approval.approverId;
      approvalNote = `approved by ${approval.approverName}`;
    } else if (!SELF_VOID_ROLES.includes(session.role)) {
      return { error: "You are not allowed to void an item. Ask a manager or owner to approve." };
    }

    const [item] = await Promise.all([
      prisma.orderItem.findUnique({
        where: { id: data.orderItemId },
        include: { order: { include: { items: true, bills: { select: { status: true } } } } },
      }),
    ]);
    if (!item || item.order.restaurantId !== session.restaurantId) return { error: "Order item not found" };
    if (item.status === "CANCELLED") return { error: "Item is already voided" };
    if (item.order.bills.some((b) => b.status === "PAID")) {
      return { error: "Cannot void an item on a paid bill" };
    }

    const order = await prisma.$transaction(async (tx) => {
      await tx.orderItem.update({
        where: { id: item.id },
        data: {
          status: "CANCELLED",
          voidedBy: voidedById,
          voidReason: data.reason.trim(),
          voidedAt: new Date(),
        },
      });

      const remainingItems = item.order.items.map((i) =>
        i.id === item.id ? { ...i, status: "CANCELLED" } : i
      );
      const { subtotal, taxAmount, totalAmount, discount } = recomputeOrderTotals(
        remainingItems,
        item.order.serviceCharge,
        item.order.discountAmount
      );

      return tx.order.update({
        where: { id: item.order.id },
        data: { subtotal, taxAmount, totalAmount, discountAmount: discount },
        include: { items: true },
      });
    });

    await prisma.activityLog.create({
      data: {
        restaurantId: session.restaurantId,
        userId: session.id,
        actionType: "ORDER_ITEM_VOID",
        entityType: "OrderItem",
        entityId: item.id,
        description: `${item.menuItemName} x${item.quantity} voided from order ${item.order.orderId} by ${session.username} (${approvalNote}): ${data.reason.trim()}`,
      },
    });

    return { data: order };
  } catch (err: any) {
    return { error: err?.message || "Failed to void order item" };
  }
}

/**
 * Voids an entire order after it has left the kitchen queue (READY/SERVED), which
 * the normal kitchen-side cancel flow doesn't allow. Requires manager approval and
 * is blocked once the order has been paid.
 */
export async function voidOrder(data: {
  orderId: string;
  reason: string;
  approverUsername?: string;
  approverPassword?: string;
}) {
  const session = await getSession();
  if (!session || !session.restaurantId) return { error: "Not authenticated" };
  if (!data.reason?.trim()) return { error: "A void reason is required" };

  try {
    const wantsApproval = !!(data.approverUsername?.trim() && data.approverPassword);

    let voidedById = session.id;
    let approvalNote = "self-authorized";

    if (wantsApproval) {
      const approval = await verifyManagerApproval(
        session.restaurantId,
        data.approverUsername!.trim(),
        data.approverPassword!
      );
      if (!approval.ok) return { error: approval.error };
      voidedById = approval.approverId;
      approvalNote = `approved by ${approval.approverName}`;
    } else if (!SELF_VOID_ROLES.includes(session.role)) {
      return { error: "You are not allowed to void an order. Ask a manager or owner to approve." };
    }

    const order = await prisma.order.findFirst({
      where: { id: data.orderId, restaurantId: session.restaurantId },
      include: { bills: { select: { status: true } } },
    });
    if (!order) return { error: "Order not found" };
    if (order.status === "CANCELLED") return { error: "Order is already cancelled" };
    if (order.bills.some((b) => b.status === "PAID")) {
      return { error: "Cannot void an order with a paid bill" };
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
          voidedBy: voidedById,
          voidReason: data.reason.trim(),
          voidedAt: new Date(),
        },
        include: { table: true },
      });
      await tx.orderItem.updateMany({
        where: { orderId: order.id },
        data: { status: "CANCELLED" },
      });
      await releaseTableForOrder(tx, result);
      return result;
    });

    await prisma.activityLog.create({
      data: {
        restaurantId: session.restaurantId,
        userId: session.id,
        actionType: "ORDER_VOID",
        entityType: "Order",
        entityId: order.id,
        description: `Order ${order.orderId} voided by ${session.username} (${approvalNote}): ${data.reason.trim()}`,
      },
    });

    return { data: updated };
  } catch (err: any) {
    return { error: err?.message || "Failed to void order" };
  }
}
