"use server";

import prisma from "@/lib/prisma";

export async function getAdminStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalRestaurants,
    activeToday,
    newSignups,
    totalOrders,
  ] = await Promise.all([
    prisma.restaurant.count({ where: { isActive: true } }),
    prisma.restaurant.count({
      where: {
        isActive: true,
        updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.restaurant.count({
      where: { createdAt: { gte: new Date(new Date().setDate(1)) } },
    }),
    prisma.order.count({
      where: { createdAt: { gte: today } },
    }),
  ]);

  const totalGMV = await prisma.order.aggregate({
    where: { createdAt: { gte: today }, status: { not: "CANCELLED" } },
    _sum: { totalAmount: true },
  });

  return {
    totalRestaurants,
    activeToday,
    newSignups,
    totalOrders,
    todayGMV: totalGMV._sum.totalAmount || 0,
  };
}

export async function getAdminRecentOrders(limit = 5) {
  return prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      restaurant: { select: { name: true } },
      items: { take: 3 },
    },
  });
}

export async function getSubscriptionDistribution() {
  const plans = await prisma.plan.findMany({
    include: { _count: { select: { subscriptions: true } } },
  });

  return plans.map((plan) => ({
    name: plan.name,
    value: plan._count.subscriptions,
    percentage: 0,
  }));
}
