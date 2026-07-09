"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function createOrder(data: {
  draftItems: Array<{ menuItem: { id: string, name: string, price: number }, quantity: number, notes?: string }>;
  tableNumber: string | null;
  guestCount: number;
}) {
  const session = await getSession();
  if (!session || !session.restaurantId) {
    return { error: "Not authenticated" };
  }

  try {
    // Basic verification and total calculation
    let subtotal = 0;
    const itemsToCreate = [];

    for (const item of data.draftItems) {
      // Find menu item to ensure price is accurate
      const menuItem = await prisma.menuItem.findUnique({ where: { id: item.menuItem.id } });
      if (!menuItem) continue;

      const price = menuItem.price;
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
      return { error: "No valid items in order." };
    }

    // Attempt to find the table
    let tableId = null;
    if (data.tableNumber) {
      const tableNum = parseInt(data.tableNumber, 10);
      if (!isNaN(tableNum)) {
        const table = await prisma.restaurantTable.findUnique({
          where: {
            restaurantId_tableNumber: {
              restaurantId: session.restaurantId,
              tableNumber: tableNum,
            }
          }
        });
        if (table) tableId = table.id;
      }
    }

    // Create a friendly order ID
    const today = new Date();
    const count = await prisma.order.count({
      where: {
        restaurantId: session.restaurantId,
        createdAt: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        },
      },
    });
    const friendlyOrderId = (1000 + count + 1).toString();

    // Default taxes
    const taxAmount = subtotal * 0.13; // Assume 13% tax
    const totalAmount = subtotal + taxAmount;

    const order = await prisma.order.create({
      data: {
        restaurantId: session.restaurantId,
        tableId,
        orderId: friendlyOrderId,
        orderType: "DINE_IN",
        status: "PENDING",
        subtotal,
        taxAmount,
        totalAmount,
        assignedWaiterId: session.role === "WAITER" ? session.id : null,
        items: {
          create: itemsToCreate
        }
      },
      include: {
        items: true,
      }
    });

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
    const orders = await prisma.order.findMany({
      where: {
        restaurantId: session.restaurantId,
        status: {
          in: ["PENDING", "PREPARING"]
        }
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    // We also might want the table number for display, let's include it
    const ordersWithTableNum = await Promise.all(orders.map(async (order) => {
      let tableNum = null;
      if (order.tableId) {
        const table = await prisma.restaurantTable.findUnique({ where: { id: order.tableId } });
        if (table) tableNum = table.tableNumber.toString();
      }
      return { ...order, tableId: tableNum || order.tableId };
    }));

    return { data: ordersWithTableNum };
  } catch (err: any) {
    return { error: err?.message || "Failed to fetch kitchen orders" };
  }
}

export async function updateOrderStatus(orderId: string, status: string) {
  const session = await getSession();
  if (!session || !session.restaurantId) {
    return { error: "Not authenticated" };
  }

  try {
    const order = await prisma.order.update({
      where: {
        id: orderId,
        restaurantId: session.restaurantId, // security check
      },
      data: {
        status,
        updatedAt: new Date(),
        ...(status === "READY" ? { completedAt: new Date() } : {})
      }
    });

    return { data: order };
  } catch (err: any) {
    return { error: err?.message || "Failed to update order status" };
  }
}
