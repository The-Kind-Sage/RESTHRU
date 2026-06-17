"use server";

import prisma from "@/lib/prisma";

export async function getDashboardStats(restaurantId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalOrders, todayOrders, activeTables, pendingOrders] =
    await Promise.all([
      prisma.order.count({
        where: { restaurantId },
      }),
      prisma.order.count({
        where: {
          restaurantId,
          createdAt: { gte: today },
        },
      }),
      prisma.restaurantTable.count({
        where: {
          restaurantId,
          status: { not: "AVAILABLE" },
        },
      }),
      prisma.order.count({
        where: {
          restaurantId,
          status: { in: ["PENDING", "PREPARING"] },
        },
      }),
    ]);

  const totalTables = await prisma.restaurantTable.count({
    where: { restaurantId },
  });

  const todayRevenue = await prisma.order.aggregate({
    where: {
      restaurantId,
      createdAt: { gte: today },
      status: { not: "CANCELLED" },
    },
    _sum: { totalAmount: true },
  });

  return {
    totalOrders,
    todayOrders,
    todayRevenue: todayRevenue._sum.totalAmount || 0,
    activeTables,
    totalTables,
    pendingOrders,
    occupiedTables: activeTables,
    availableTables: totalTables - activeTables,
  };
}

export async function getRecentOrders(restaurantId: string, limit = 5) {
  return prisma.order.findMany({
    where: { restaurantId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      items: true,
      table: true,
    },
  });
}

export async function getRevenueChartData(
  restaurantId: string,
  period: "week" | "month" = "week"
) {
  const now = new Date();
  const startDate = new Date();
  startDate.setDate(now.getDate() - (period === "week" ? 7 : 30));

  const orders = await prisma.order.findMany({
    where: {
      restaurantId,
      createdAt: { gte: startDate },
      status: { not: "CANCELLED" },
    },
    select: { totalAmount: true, createdAt: true },
  });

  const dailyMap = new Map<string, number>();
  for (let i = 0; i < (period === "week" ? 7 : 30); i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    dailyMap.set(key, 0);
  }

  for (const order of orders) {
    const key = order.createdAt.toISOString().split("T")[0];
    if (dailyMap.has(key)) {
      dailyMap.set(key, (dailyMap.get(key) || 0) + order.totalAmount);
    }
  }

  return Array.from(dailyMap.entries())
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getTopSellingItems(restaurantId: string, limit = 5) {
  const items = await prisma.orderItem.groupBy({
    by: ["menuItemName"],
    where: { order: { restaurantId } },
    _sum: { quantity: true },
    _avg: { pricePerUnit: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  return items.map((item) => ({
    name: item.menuItemName,
    orders: item._sum.quantity || 0,
    revenue: (item._sum.quantity || 0) * (item._avg.pricePerUnit || 0),
    percentage: 0,
    isVeg: !item.menuItemName.toLowerCase().includes("chicken"),
  }));
}

export async function getRecentActivity(restaurantId: string, limit = 5) {
  const [orders, bills] = await Promise.all([
    prisma.order.findMany({
      where: { restaurantId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, orderId: true, status: true, tableId: true, createdAt: true },
    }),
    prisma.bill.findMany({
      where: { restaurantId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { billNumber: true, totalAmount: true, createdAt: true },
    }),
  ]);

  const activities: {
    id: string;
    type: "order" | "payment" | "alert" | "cancelled" | "staff";
    title: string;
    time: Date;
  }[] = [];

  for (const order of orders) {
    activities.push({
      id: `o-${order.id}`,
      type: order.status === "CANCELLED" ? "cancelled" : "order",
      title:
        order.status === "CANCELLED"
          ? `Order ${order.orderId} cancelled`
          : order.tableId
            ? `Table ${order.tableId} order placed`
            : `Order ${order.orderId} placed`,
      time: order.createdAt,
    });
  }

  for (const bill of bills) {
    activities.push({
      id: `b-${bill.billNumber}`,
      type: "payment",
      title: `Bill ${bill.billNumber} paid - NPR ${bill.totalAmount.toLocaleString()}`,
      time: bill.createdAt,
    });
  }

  return activities
    .sort((a, b) => b.time.getTime() - a.time.getTime())
    .slice(0, limit);
}
