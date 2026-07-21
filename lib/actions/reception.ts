"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "./logs";

export async function getReservations(date?: string) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const reservations = await prisma.reservation.findMany({
      where: {
        restaurantId: session.restaurantId,
        reservedFor: { gte: startOfDay, lte: endOfDay },
      },
      include: { table: { select: { tableNumber: true, name: true } } },
      orderBy: { reservedFor: "asc" },
    });
    return { data: reservations };
  } catch (err: any) {
    return { error: err?.message || "Failed to fetch reservations" };
  }
}

export async function createReservation(data: {
  customerName: string;
  customerPhone: string;
  partySize: number;
  reservedFor: string;
  tableId?: string;
  notes?: string;
}) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const reservation = await prisma.reservation.create({
      data: {
        restaurantId: session.restaurantId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        partySize: data.partySize,
        reservedFor: new Date(data.reservedFor),
        tableId: data.tableId || null,
        notes: data.notes || null,
        status: "BOOKED",
      },
      include: { table: { select: { tableNumber: true, name: true } } },
    });
    await logActivity(session, {
      actionType: "RESERVATION_CREATE",
      entityType: "Reservation",
      entityId: reservation.id,
      description: `Reservation for ${data.customerName} (${data.partySize} guests) on ${data.reservedFor}`,
    });
    return { data: reservation };
  } catch (err: any) {
    return { error: err?.message || "Failed to create reservation" };
  }
}

export async function checkInReservation(reservationId: string, tableId?: string) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const reservation = await prisma.reservation.findFirst({
      where: { id: reservationId, restaurantId: session.restaurantId },
    });
    if (!reservation) return { error: "Reservation not found" };

    const updateData: any = {
      status: "CHECKED_IN",
      checkedInAt: new Date(),
    };
    if (tableId) updateData.tableId = tableId;

    const updated = await prisma.reservation.update({
      where: { id: reservationId },
      data: updateData,
      include: { table: { select: { tableNumber: true, name: true } } },
    });

    if (tableId) {
      await prisma.restaurantTable.update({
        where: { id: tableId },
        data: { status: "RESERVED" },
      });
    }

    await logActivity(session, {
      actionType: "RESERVATION_CHECKIN",
      entityType: "Reservation",
      entityId: reservationId,
      description: `Reservation checked in`,
    });
    return { data: updated };
  } catch (err: any) {
    return { error: err?.message || "Failed to check in reservation" };
  }
}

export async function cancelReservation(reservationId: string) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const reservation = await prisma.reservation.findFirst({
      where: { id: reservationId, restaurantId: session.restaurantId },
    });
    if (!reservation) return { error: "Reservation not found" };

    const updated = await prisma.reservation.update({
      where: { id: reservationId },
      data: { status: "CANCELLED" },
    });

    if (reservation.tableId) {
      const hasOtherReservations = await prisma.reservation.findFirst({
        where: {
          tableId: reservation.tableId,
          status: { in: ["BOOKED", "CHECKED_IN"] },
          id: { not: reservationId },
        },
      });
      if (!hasOtherReservations) {
        const hasActiveOrder = await prisma.order.findFirst({
          where: { tableId: reservation.tableId, status: { in: ["PENDING", "PREPARING", "READY", "SERVED"] } },
        });
        if (!hasActiveOrder) {
          await prisma.restaurantTable.update({
            where: { id: reservation.tableId },
            data: { status: "AVAILABLE" },
          });
        }
      }
    }

    await logActivity(session, {
      actionType: "RESERVATION_CANCEL",
      entityType: "Reservation",
      entityId: reservationId,
      description: `Reservation cancelled`,
    });
    return { data: updated };
  } catch (err: any) {
    return { error: err?.message || "Failed to cancel reservation" };
  }
}

export async function updateReservation(reservationId: string, data: {
  customerName?: string;
  customerPhone?: string;
  partySize?: number;
  reservedFor?: string;
  tableId?: string | null;
  notes?: string;
}) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const updateData: any = {};
    if (data.customerName) updateData.customerName = data.customerName;
    if (data.customerPhone) updateData.customerPhone = data.customerPhone;
    if (data.partySize) updateData.partySize = data.partySize;
    if (data.reservedFor) updateData.reservedFor = new Date(data.reservedFor);
    if (data.tableId !== undefined) updateData.tableId = data.tableId;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const updated = await prisma.reservation.update({
      where: { id: reservationId },
      data: updateData,
      include: { table: { select: { tableNumber: true, name: true } } },
    });

    const changedFields = Object.keys(updateData);
    await logActivity(session, {
      actionType: "RESERVATION_UPDATE",
      entityType: "Reservation",
      entityId: reservationId,
      description: `Reservation for ${updated.customerName} updated${
        changedFields.length ? ` (${changedFields.join(", ")})` : ""
      }`,
    });

    return { data: updated };
  } catch (err: any) {
    return { error: err?.message || "Failed to update reservation" };
  }
}

export async function walkInAssignTable(data: {
  tableId: string;
  guestCount: number;
  customerName?: string;
  customerPhone?: string;
  assignedWaiterId?: string;
}) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    // Table validation and next-order-number lookup are independent — run them
    // together so the common (valid-table) path saves a round-trip. On the rare
    // invalid-table path this costs one wasted number lookup, which is cheap.
    const [table, lastOrder] = await Promise.all([
      prisma.restaurantTable.findFirst({
        where: { id: data.tableId, restaurantId: session.restaurantId },
      }),
      prisma.order.findFirst({
        where: { restaurantId: session.restaurantId },
        orderBy: { createdAt: "desc" },
        select: { orderId: true },
      }),
    ]);
    if (!table) return { error: "Table not found" };
    if (table.status !== "AVAILABLE") return { error: "Table is not available" };

    const lastNumber = parseInt(lastOrder?.orderId ?? "", 10);
    const nextNumber = isNaN(lastNumber) ? 1001 : lastNumber + 1;

    const rid = session.restaurantId as string;
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          restaurantId: rid,
          tableId: data.tableId,
          orderId: nextNumber.toString(),
          orderType: "DINE_IN",
          status: "PENDING",
          subtotal: 0,
          taxAmount: 0,
          totalAmount: 0,
          assignedWaiterId: data.assignedWaiterId || session.id,
          customerName: data.customerName || null,
          customerPhone: data.customerPhone || null,
        },
      });

      await tx.restaurantTable.update({
        where: { id: data.tableId },
        data: {
          status: "OCCUPIED",
          currentOrderId: created.id,
          occupiedSince: new Date(),
          assignedWaiterId: data.assignedWaiterId || session.id,
        },
      });

      return created;
    });

    await logActivity(session, {
      actionType: "WALK_IN_ASSIGN",
      entityType: "RestaurantTable",
      entityId: data.tableId,
      description: `Walk-in assigned to table`,
    });
    return { data: order };
  } catch (err: any) {
    return { error: err?.message || "Failed to assign table" };
  }
}

export async function mergeTables(sourceTableIds: string[], targetTableId: string) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    // Table existence, source orders, and the target's existing order are all
    // independent — one round-trip instead of three on the happy path.
    const [tables, sourceOrders, targetOrder] = await Promise.all([
      prisma.restaurantTable.findMany({
        where: { id: { in: [...sourceTableIds, targetTableId] }, restaurantId: session.restaurantId },
      }),
      prisma.order.findMany({
        where: {
          tableId: { in: sourceTableIds },
          status: { in: ["PENDING", "PREPARING", "READY", "SERVED"] },
        },
        include: { items: true },
      }),
      prisma.order.findFirst({
        where: { tableId: targetTableId, status: { in: ["PENDING", "PREPARING", "READY", "SERVED"] } },
      }),
    ]);
    if (tables.length !== sourceTableIds.length + 1) return { error: "One or more tables not found" };

    const targetTable = tables.find((t) => t.id === targetTableId);
    if (!targetTable) return { error: "Target table not found" };

    if (sourceOrders.length === 0) return { error: "No active orders on source tables" };

    const mergeResult = await prisma.$transaction(async (tx) => {
      let primaryOrder = targetOrder;

      for (const sourceOrder of sourceOrders) {
        if (primaryOrder) {
          await tx.orderItem.updateMany({
            where: { orderId: sourceOrder.id },
            data: { orderId: primaryOrder.id },
          });

          // No VAT — merged totals are plain menu prices (+ service charge).
          const sourceTotal = sourceOrder.subtotal + sourceOrder.serviceCharge;
          await tx.order.update({
            where: { id: primaryOrder.id },
            data: {
              subtotal: { increment: sourceOrder.subtotal },
              serviceCharge: { increment: sourceOrder.serviceCharge },
              totalAmount: { increment: sourceTotal },
            },
          });

          await tx.order.update({
            where: { id: sourceOrder.id },
            data: { status: "CANCELLED", completedAt: new Date() },
          });
        } else {
          primaryOrder = sourceOrder;
          await tx.order.update({
            where: { id: sourceOrder.id },
            data: { tableId: targetTableId },
          });
        }
      }

      if (!primaryOrder) return { error: "No orders to merge" };

      await tx.restaurantTable.update({
        where: { id: targetTableId },
        data: { status: "OCCUPIED", currentOrderId: primaryOrder.id },
      });

      for (const sourceId of sourceTableIds) {
        const hasOtherOrders = await tx.order.findFirst({
          where: { tableId: sourceId, status: { in: ["PENDING", "PREPARING", "READY", "SERVED"] } },
        });
        if (!hasOtherOrders) {
          await tx.restaurantTable.update({
            where: { id: sourceId },
            data: { status: "AVAILABLE", currentOrderId: null, occupiedSince: null },
          });
        }
      }

      return { data: { primaryOrderId: primaryOrder.id } };
    });

    await logActivity(session, {
      actionType: "TABLE_MERGE",
      entityType: "RestaurantTable",
      entityId: targetTableId,
      description: `Table ${targetTableId} merged into table ${sourceTableIds[0]}`,
    });
    return mergeResult;
  } catch (err: any) {
    return { error: err?.message || "Failed to merge tables" };
  }
}

export async function splitOrderItems(orderId: string, itemIds: string[], targetTableId: string) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    // Source order, target table, and next-order-number are independent lookups.
    const [sourceOrder, targetTable, lastOrder] = await Promise.all([
      prisma.order.findFirst({
        where: { id: orderId, restaurantId: session.restaurantId },
        include: { items: true },
      }),
      prisma.restaurantTable.findFirst({
        where: { id: targetTableId, restaurantId: session.restaurantId },
      }),
      prisma.order.findFirst({
        where: { restaurantId: session.restaurantId },
        orderBy: { createdAt: "desc" },
        select: { orderId: true },
      }),
    ]);
    if (!sourceOrder) return { error: "Source order not found" };
    if (!targetTable) return { error: "Target table not found" };

    const itemsToSplit = sourceOrder.items.filter((i) => itemIds.includes(i.id));
    if (itemsToSplit.length === 0) return { error: "No matching items found" };
    const lastNumber = parseInt(lastOrder?.orderId ?? "", 10);
    const nextNumber = isNaN(lastNumber) ? 1001 : lastNumber + 1;

    const splitSubtotal = itemsToSplit.reduce((s, i) => s + i.pricePerUnit * i.quantity, 0);

    const splitResult = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          restaurantId: session.restaurantId as string,
          tableId: targetTableId,
          orderId: nextNumber.toString(),
          orderType: "DINE_IN",
          status: "PENDING",
          subtotal: splitSubtotal,
          taxAmount: 0,
          totalAmount: splitSubtotal,
          assignedWaiterId: sourceOrder.assignedWaiterId,
        },
      });

      for (const item of itemsToSplit) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            menuItemId: item.menuItemId,
            menuItemName: item.menuItemName,
            quantity: item.quantity,
            pricePerUnit: item.pricePerUnit,
            specialInstructions: item.specialInstructions,
            addOnData: item.addOnData as any,
            status: "PENDING",
          },
        });
        await tx.orderItem.delete({ where: { id: item.id } });
      }

      const remainingItems = await tx.orderItem.findMany({ where: { orderId } });
      if (remainingItems.length === 0) {
        await tx.order.update({
          where: { id: orderId },
          data: { status: "CANCELLED", completedAt: new Date() },
        });
        await tx.restaurantTable.update({
          where: { id: sourceOrder.tableId! },
          data: { status: "AVAILABLE", currentOrderId: null, occupiedSince: null },
        });
      } else {
        const remainingSubtotal = remainingItems.reduce((s, i) => s + i.pricePerUnit * i.quantity, 0);
        await tx.order.update({
          where: { id: orderId },
          data: {
            subtotal: remainingSubtotal,
            taxAmount: 0,
            totalAmount: remainingSubtotal,
          },
        });
      }

      await tx.restaurantTable.update({
        where: { id: targetTableId },
        data: { status: "OCCUPIED", currentOrderId: newOrder.id, occupiedSince: new Date() },
      });

      return { data: { newOrderId: newOrder.id, sourceOrderId: orderId } };
    });

    await logActivity(session, {
      actionType: "ORDER_SPLIT",
      entityType: "Order",
      entityId: orderId,
      description: `${itemsToSplit.length} item(s) split from order ${sourceOrder.orderId} to table ${targetTable.tableNumber}`,
    });

    return splitResult;
  } catch (err: any) {
    return { error: err?.message || "Failed to split order" };
  }
}

export async function getWaitlistEntries() {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const entries = await prisma.waitlistEntry.findMany({
      where: {
        restaurantId: session.restaurantId,
        status: { in: ["WAITING", "NOTIFIED"] },
      },
      orderBy: { createdAt: "asc" },
    });
    return { data: entries };
  } catch (err: any) {
    return { error: err?.message || "Failed to fetch waitlist" };
  }
}

export async function addToWaitlist(data: {
  customerName: string;
  customerPhone: string;
  partySize: number;
  quotedWaitMinutes?: number;
  notifyMethod?: "SMS" | "PUSH" | "CALL";
}) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    // Calculate estimated wait time based on current queue and table turnover
    const estimatedWait = await calculateEstimatedWaitTime(
      session.restaurantId,
      data.partySize
    );

    const entry = await prisma.waitlistEntry.create({
      data: {
        restaurantId: session.restaurantId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        partySize: data.partySize,
        quotedWaitMinutes: data.quotedWaitMinutes ?? estimatedWait,
        estimatedReadyAt: new Date(Date.now() + (data.quotedWaitMinutes ?? estimatedWait) * 60 * 1000),
        status: "WAITING",
        notifyMethod: data.notifyMethod ?? "SMS",
      },
    });
    await logActivity(session, {
      actionType: "WAITLIST_ADD",
      entityType: "WaitlistEntry",
      entityId: entry.id,
      description: `${data.partySize} guests added to waitlist for ${data.customerName} (est. ${entry.quotedWaitMinutes} min)`,
    });
    return { data: entry };
  } catch (err: any) {
    return { error: err?.message || "Failed to add to waitlist" };
  }
}

async function calculateEstimatedWaitTime(restaurantId: string, partySize: number): Promise<number> {
  try {
    // Get current waiting entries ahead in queue
    const waitingCount = await prisma.waitlistEntry.count({
      where: { restaurantId, status: "WAITING" },
    });

    // Get average table turnover time (last 20 completed orders)
    const recentOrders = await prisma.order.findMany({
      where: {
        restaurantId,
        status: "SERVED",
        tableId: { not: null },
        table: { capacity: { gte: partySize } },
      },
      orderBy: { completedAt: "desc" },
      take: 20,
      select: {
        createdAt: true,
        completedAt: true,
      },
    });

    let avgTurnover = 45; // default 45 minutes
    if (recentOrders.length > 0) {
      const totalMinutes = recentOrders.reduce((sum, o) => {
        if (o.completedAt) {
          return sum + (o.completedAt.getTime() - o.createdAt.getTime()) / 60000;
        }
        return sum;
      }, 0);
      avgTurnover = Math.round(totalMinutes / recentOrders.length);
    }

    // Estimate: waiting parties * avg turnover / available tables for party size
    const availableTables = await prisma.restaurantTable.count({
      where: {
        restaurantId,
        status: "AVAILABLE",
        capacity: { gte: partySize },
      },
    });

    const tablesNeeded = Math.max(1, waitingCount + 1);
    const tablesAvailable = Math.max(1, availableTables);
    const estimatedMinutes = Math.round((tablesNeeded / tablesAvailable) * avgTurnover);

    return Math.min(Math.max(estimatedMinutes, 10), 120); // clamp 10-120 min
  } catch {
    return 30; // fallback
  }
}

export async function notifyWaitlistEntry(entryId: string) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const entry = await prisma.waitlistEntry.findFirst({
      where: { id: entryId, restaurantId: session.restaurantId },
    });
    if (!entry) return { error: "Waitlist entry not found" };

    // Send notification based on method
    await sendWaitlistNotification(entry);

    const updated = await prisma.waitlistEntry.update({
      where: { id: entryId },
      data: {
        status: "NOTIFIED",
        notifiedAt: new Date(),
      },
    });
    await logActivity(session, {
      actionType: "WAITLIST_NOTIFY",
      entityType: "WaitlistEntry",
      entityId: entryId,
      description: `Waitlist entry notified via ${entry.notifyMethod}`,
    });
    return { data: updated };
  } catch (err: any) {
    return { error: err?.message || "Failed to notify waitlist entry" };
  }
}

async function sendWaitlistNotification(entry: any) {
  const message = `Your table for ${entry.partySize} is ready at ${entry.restaurant?.name || "the restaurant"}. Please proceed to the host stand.`;
  
  switch (entry.notifyMethod) {
    case "SMS":
      // TODO: Integrate with SMS provider (Twilio, etc.)
      console.log(`[SMS to ${entry.customerPhone}] ${message}`);
      // await sendSMS(entry.customerPhone, message);
      break;
    case "PUSH":
      // TODO: Integrate with push notification service
      console.log(`[PUSH to ${entry.customerPhone}] ${message}`);
      break;
    case "CALL":
      // Manual call - just log
      console.log(`[CALL to ${entry.customerPhone}] ${message}`);
      break;
  }
}

export async function seatWaitlistEntry(entryId: string, tableId: string) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    // Waitlist entry, table, and next-order-number are independent lookups.
    const [entry, table, lastOrder] = await Promise.all([
      prisma.waitlistEntry.findFirst({
        where: { id: entryId, restaurantId: session.restaurantId },
      }),
      prisma.restaurantTable.findFirst({
        where: { id: tableId, restaurantId: session.restaurantId },
      }),
      prisma.order.findFirst({
        where: { restaurantId: session.restaurantId },
        orderBy: { createdAt: "desc" },
        select: { orderId: true },
      }),
    ]);
    if (!entry) return { error: "Waitlist entry not found" };
    if (!table) return { error: "Table not found" };
    if (table.status !== "AVAILABLE") return { error: "Table is not available" };
    const lastNumber = parseInt(lastOrder?.orderId ?? "", 10);
    const nextNumber = isNaN(lastNumber) ? 1001 : lastNumber + 1;

    const seatResult = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          restaurantId: session.restaurantId as string,
          tableId,
          orderId: nextNumber.toString(),
          orderType: "DINE_IN",
          status: "PENDING",
          subtotal: 0,
          taxAmount: 0,
          totalAmount: 0,
          assignedWaiterId: session.id,
          customerName: entry.customerName,
          customerPhone: entry.customerPhone,
        },
      });

      await tx.restaurantTable.update({
        where: { id: tableId },
        data: {
          status: "OCCUPIED",
          currentOrderId: order.id,
          occupiedSince: new Date(),
          assignedWaiterId: session.id,
        },
      });

      await tx.waitlistEntry.update({
        where: { id: entryId },
        data: { status: "SEATED", seatedAt: new Date() },
      });

      return { data: { order, entry } };
    });

    await logActivity(session, {
      actionType: "WAITLIST_SEAT",
      entityType: "WaitlistEntry",
      entityId: entryId,
      description: `Waitlist entry seated at table`,
    });
    return seatResult;
  } catch (err: any) {
    return { error: err?.message || "Failed to seat waitlist entry" };
  }
}

export async function removeFromWaitlist(entryId: string) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const updated = await prisma.waitlistEntry.update({
      where: { id: entryId },
      data: { status: "CANCELLED" },
    });
    await logActivity(session, {
      actionType: "WAITLIST_REMOVE",
      entityType: "WaitlistEntry",
      entityId: entryId,
      description: `Waitlist entry removed`,
    });
    return { data: updated };
  } catch (err: any) {
    return { error: err?.message || "Failed to remove waitlist entry" };
  }
}

export async function getAvailableTables() {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const tables = await prisma.restaurantTable.findMany({
      where: { restaurantId: session.restaurantId },
      orderBy: [{ floor: "asc" }, { tableNumber: "asc" }],
    });
    return { data: tables };
  } catch (err: any) {
    return { error: err?.message || "Failed to fetch tables" };
  }
}

export async function getActiveOrdersForTableMerge() {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const orders = await prisma.order.findMany({
      where: {
        restaurantId: session.restaurantId,
        status: { in: ["PENDING", "PREPARING", "READY", "SERVED"] },
        tableId: { not: null },
      },
      include: {
        items: true,
        table: { select: { tableNumber: true, name: true } },
        bills: { select: { id: true, billNumber: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return { data: orders };
  } catch (err: any) {
    return { error: err?.message || "Failed to fetch active orders" };
  }
}
