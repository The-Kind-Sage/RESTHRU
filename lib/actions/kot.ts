"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export type KotData = {
  kotNumber: number;
  orderId: string;
  /** null for orders that don't sit at a table (delivery/takeaway/pickup). */
  tableLabel: string | null;
  orderTypeLabel: string;
  waiterName: string;
  orderedAt: string;
  items: Array<{ name: string; qty: number; notes?: string | null }>;
  totalDishes: number;
  totalQty: number;
};

const ORDER_TYPE_LABELS: Record<string, string> = {
  DINE_IN: "Dine In",
  TAKEAWAY: "Take away",
  DELIVERY: "Delivery",
  PICKUP: "Pick up",
};

/**
 * Gathers everything a kitchen docket needs and assigns the order its KOT
 * number on first use.
 *
 * The number is sequential per restaurant and stored on the order, so a
 * reprint always shows the same "KOT n" the kitchen already has on the pass —
 * regenerating it per print would hand out conflicting tickets for one order.
 *
 * The waiter is resolved here rather than included on the order query because
 * `assignedWaiterId` has no Prisma relation to User.
 */
export async function prepareKot(orderId: string) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };
  const restaurantId = session.restaurantId;

  try {
    const order = await prisma.order.findFirst({
      where: { id: orderId, restaurantId },
      include: {
        items: true,
        table: { select: { tableNumber: true } },
      },
    });
    if (!order) return { error: "Order not found" };

    // Assign a KOT number the first time this order is sent to the kitchen.
    let kotNumber = order.kotNumber;
    if (kotNumber == null) {
      const highest = await prisma.order.aggregate({
        where: { restaurantId, kotNumber: { not: null } },
        _max: { kotNumber: true },
      });
      kotNumber = (highest._max.kotNumber ?? 0) + 1;
      await prisma.order.update({
        where: { id: order.id },
        data: { kotNumber },
      });
    }

    // Cancelled/voided lines must never reach the kitchen.
    const items = order.items
      .filter((i) => i.status !== "CANCELLED" && i.status !== "VOIDED")
      .map((i) => ({
        name: i.menuItemName,
        qty: i.quantity,
        notes: i.specialInstructions,
      }));

    let waiterName = "—";
    if (order.assignedWaiterId) {
      const waiter = await prisma.user.findUnique({
        where: { id: order.assignedWaiterId },
        select: { firstName: true, lastName: true, username: true },
      });
      if (waiter) {
        waiterName =
          [waiter.firstName, waiter.lastName].filter(Boolean).join(" ").trim() ||
          waiter.username ||
          "—";
      }
    }

    const data: KotData = {
      kotNumber,
      orderId: order.orderId,
      tableLabel: order.table?.tableNumber
        ? `Table ${order.table.tableNumber}`
        : null,
      orderTypeLabel: ORDER_TYPE_LABELS[order.orderType] ?? order.orderType,
      waiterName,
      orderedAt: order.createdAt.toISOString(),
      items,
      totalDishes: items.length,
      totalQty: items.reduce((sum, i) => sum + i.qty, 0),
    };

    return { data };
  } catch (err: any) {
    return { error: err?.message || "Failed to prepare KOT" };
  }
}
