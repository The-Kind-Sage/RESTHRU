"use server";

import prisma from "@/lib/prisma";

export async function getAdminStats() {
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const [totalRestaurants, todayOrders] = await Promise.all([
    prisma.restaurant.count({ where: { isActive: true } }),
    prisma.order.count({ where: { createdAt: { gte: today } } }),
  ]);

  const todayGMV = await prisma.order.aggregate({
    where: { createdAt: { gte: today }, status: { not: "CANCELLED" } },
    _sum: { totalAmount: true },
  });

  return {
    totalRestaurants,
    activeToday: 0,
    newSignups: 0,
    totalOrders: todayOrders,
    todayGMV: todayGMV._sum.totalAmount || 0,
  };
}

export async function getRecentOrders(limit = 10) {
  return prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { restaurant: { select: { name: true } } },
  });
}

export async function getSubscriptionDistribution() {
  const plans = await prisma.plan.findMany({
    include: { _count: { select: { subscriptions: true } } },
  });
  return plans.map((plan) => ({
    name: plan.name,
    value: plan._count.subscriptions,
  }));
}
