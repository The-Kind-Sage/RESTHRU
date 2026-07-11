"use server";

// Public, unauthenticated server actions for the customer-facing QR table-ordering
// page (`app/r/[restaurantId]/t/[tableId]/page.tsx`). There is no session here — a
// diner reaches this page by scanning a QR code, so every input (restaurantId,
// tableId, menuItemId, prices) must be independently verified against the DB. Never
// trust anything the client sends beyond identifiers to look up.

import prisma from "@/lib/prisma";
import { getEffectiveTaxRate, notifyServers } from "@/lib/actions/orders";

const MAX_QUANTITY_PER_ITEM = 20;
const MAX_DISTINCT_ITEMS = 50;
const MAX_GUEST_COUNT = 30;
const MAX_NOTE_LENGTH = 500;
const VALID_PAYMENT_METHODS = ["CASH", "ESEWA", "KHALTI", "FONEPAY"];

/**
 * Creates a real order from the customer QR-ordering page. Mirrors `createOrder` in
 * `lib/actions/orders.ts` (same order/table shape, same tax calc, same friendly
 * sequential orderId) but has no session — restaurantId/tableId come from the URL
 * route params instead, and both are re-verified against the DB before anything is
 * written. `assignedWaiterId` is left null (nobody has claimed the table yet); this
 * is the same "unassigned" state `notifyServers` already falls back to, so all active
 * front-of-house staff get notified.
 */
export async function createPublicOrder(data: {
  restaurantId: string;
  tableId: string;
  items: Array<{ menuItemId: string; quantity: number; notes?: string }>;
  guestCount?: number;
}) {
  try {
    if (!data.restaurantId || !data.tableId) {
      return { error: "Missing restaurant or table" };
    }
    if (!Array.isArray(data.items) || data.items.length === 0) {
      return { error: "Your cart is empty" };
    }
    if (data.items.length > MAX_DISTINCT_ITEMS) {
      return { error: "Too many distinct items in one order" };
    }
    for (const item of data.items) {
      if (!item.menuItemId || typeof item.quantity !== "number" || !Number.isFinite(item.quantity)) {
        return { error: "Invalid item in cart" };
      }
      if (item.quantity < 1 || item.quantity > MAX_QUANTITY_PER_ITEM) {
        return { error: `Quantity must be between 1 and ${MAX_QUANTITY_PER_ITEM} per item` };
      }
    }

    // Verify the restaurant is real and active
    const restaurant = await prisma.restaurant.findFirst({
      where: { id: data.restaurantId, isActive: true },
      select: { id: true },
    });
    if (!restaurant) return { error: "Restaurant not found" };

    // Verify the table actually belongs to this restaurant — never trust the client
    const table = await prisma.restaurantTable.findFirst({
      where: { id: data.tableId, restaurantId: data.restaurantId },
    });
    if (!table) return { error: "Table not found for this restaurant" };

    // Verify menu items against the menu and recompute prices server-side
    const menuItemIds = data.items.map((i) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, restaurantId: data.restaurantId, isAvailable: true },
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

    for (const item of data.items) {
      const menuItem = menuById.get(item.menuItemId);
      if (!menuItem) {
        unavailable.push(item.menuItemId);
        continue;
      }
      const price = menuItem.discountPrice ?? menuItem.price;
      subtotal += price * item.quantity;
      itemsToCreate.push({
        menuItemId: menuItem.id,
        menuItemName: menuItem.name,
        quantity: item.quantity,
        pricePerUnit: price,
        specialInstructions: item.notes?.trim() ? item.notes.trim().slice(0, MAX_NOTE_LENGTH) : null,
        status: "PENDING",
      });
    }

    if (itemsToCreate.length === 0) {
      return { error: "None of the items in your cart are available anymore. Please refresh the menu." };
    }

    // Friendly sequential order number: continue from the restaurant's latest order
    const lastOrder = await prisma.order.findFirst({
      where: { restaurantId: data.restaurantId },
      orderBy: { createdAt: "desc" },
      select: { orderId: true },
    });
    const lastNumber = parseInt(lastOrder?.orderId ?? "", 10);
    let nextNumber = isNaN(lastNumber) ? 1001 : lastNumber + 1;

    const effectiveTaxRate = await getEffectiveTaxRate(data.restaurantId);
    const taxAmount = subtotal * (effectiveTaxRate / 100);
    const totalAmount = subtotal + taxAmount;

    void data.guestCount; // accepted for parity with createOrder's signature; Order has no guestCount column upstream either

    let order;
    for (let attempt = 0; ; attempt++) {
      try {
        order = await prisma.$transaction(async (tx) => {
          const created = await tx.order.create({
            data: {
              restaurantId: data.restaurantId,
              tableId: table.id,
              orderId: nextNumber.toString(),
              orderType: "DINE_IN",
              status: "PENDING",
              subtotal,
              taxAmount,
              totalAmount,
              assignedWaiterId: null,
              items: { create: itemsToCreate },
            },
            include: { items: true },
          });

          // Occupy the table while it has an open order — same as the staff-side flow
          await tx.restaurantTable.update({
            where: { id: table.id },
            data: {
              status: "OCCUPIED",
              currentOrderId: created.id,
              occupiedSince: table.status === "OCCUPIED" ? table.occupiedSince : new Date(),
            },
          });

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

    // Best-effort: alert front-of-house staff a new order came in unassigned.
    // Not fatal if this fails — the order itself is already committed.
    try {
      await notifyServers(
        data.restaurantId,
        order,
        "New order",
        `Order #${order.orderId} (Table ${table.tableNumber}) was placed via QR ordering.`,
        "NEW_ORDER"
      );
    } catch (notifyErr) {
      console.error("Failed to notify staff of new public order:", notifyErr);
    }

    if (unavailable.length > 0) {
      return { data: order, warning: "Some items in your cart were no longer available and were skipped." };
    }
    return { data: order };
  } catch (err: any) {
    console.error("Failed to create public order:", err);
    return { error: err?.message || "Failed to place order. Please try again." };
  }
}

/**
 * Lightweight public status poll for the order-tracker UI on the QR ordering page.
 * Scoped to restaurantId + orderId so a diner can only read their own restaurant's
 * order, not enumerate arbitrary orders.
 */
export async function getPublicOrderStatus(orderId: string, restaurantId: string) {
  try {
    if (!orderId || !restaurantId) return { error: "Missing order or restaurant" };
    const order = await prisma.order.findFirst({
      where: { id: orderId, restaurantId },
      select: {
        id: true,
        orderId: true,
        status: true,
        items: { select: { id: true, status: true } },
      },
    });
    if (!order) return { error: "Order not found" };
    return { data: order };
  } catch (err: any) {
    return { error: err?.message || "Failed to fetch order status" };
  }
}

/**
 * Wires the customer-facing "Request Bill" dialog to something real: notifies
 * front-of-house staff (same fallback-to-everyone logic as `notifyServers`) that a
 * table wants its bill, with the preferred payment method and split count. Actual
 * payment settlement still happens at `/reception/checkout` — this only records the
 * request so a real person acts on it.
 */
export async function requestPublicBill(data: {
  restaurantId: string;
  tableId: string;
  paymentMethod: string;
  splitCount?: number;
}) {
  try {
    if (!data.restaurantId || !data.tableId) {
      return { error: "Missing restaurant or table" };
    }

    const restaurant = await prisma.restaurant.findFirst({
      where: { id: data.restaurantId, isActive: true },
      select: { id: true },
    });
    if (!restaurant) return { error: "Restaurant not found" };

    const table = await prisma.restaurantTable.findFirst({
      where: { id: data.tableId, restaurantId: data.restaurantId },
    });
    if (!table) return { error: "Table not found for this restaurant" };

    const method = VALID_PAYMENT_METHODS.includes(data.paymentMethod) ? data.paymentMethod : "CASH";
    const splitCount = data.splitCount && data.splitCount > 1 && data.splitCount <= 20 ? data.splitCount : undefined;

    const order = table.currentOrderId
      ? await prisma.order.findUnique({
          where: { id: table.currentOrderId },
          select: { id: true, orderId: true, assignedWaiterId: true },
        })
      : null;

    await notifyServers(
      data.restaurantId,
      order ?? { id: table.id, orderId: table.tableNumber.toString(), assignedWaiterId: null },
      "Bill requested",
      `Table ${table.tableNumber} requested the bill${splitCount ? ` (split ${splitCount} ways)` : ""}. Preferred payment: ${method}.`,
      "BILL_REQUESTED"
    );

    return { data: true };
  } catch (err: any) {
    console.error("Failed to request bill:", err);
    return { error: err?.message || "Failed to request bill" };
  }
}
