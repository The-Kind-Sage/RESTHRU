"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Every export in this module returns cross-tenant platform data, so each one
// must independently verify the caller is an admin: Server Actions are invocable
// directly (a POST to the generated action endpoint) regardless of which UI
// gated navigation to them. Throws rather than returning null so a caller that
// forgets to handle the failure fails closed instead of rendering blank.
async function requireAdmin() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function getAdminStats() {
  await requireAdmin();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [totalRestaurants, todayOrders, newSignups, subscriptionDistribution] = await Promise.all([
    prisma.restaurant.count({ where: { isActive: true } }),
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.plan.findMany({
      include: { _count: { select: { subscriptions: true } } },
    }),
  ]);

  const todayGMV = await prisma.order.aggregate({
    where: { createdAt: { gte: today }, status: { not: "CANCELLED" } },
    _sum: { totalAmount: true },
  });

  const activeToday = await prisma.restaurant.count({
    where: { orders: { some: { createdAt: { gte: today } } } },
  });

  return {
    totalRestaurants,
    activeToday,
    newSignups,
    totalOrders: todayOrders,
    todayGMV: todayGMV._sum.totalAmount || 0,
    subscriptionDistribution: subscriptionDistribution.map((plan) => ({
      name: plan.name,
      type: plan.type,
      value: plan._count.subscriptions,
    })),
  };
}

export async function getRecentOrders(limit = 10) {
  await requireAdmin();
  return prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { restaurant: { select: { name: true } } },
  });
}

export async function getAllRestaurants() {
  await requireAdmin();
  return prisma.restaurant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { users: true, tables: true, menuItems: true, orders: true } },
      subscriptions: {
        // Subscriptions are stored with uppercase status ("ACTIVE"). Filtering
        // on "active" here previously matched nothing, so even paid restaurants
        // showed no plan. Grab the most recent active one.
        where: { status: "ACTIVE" },
        take: 1,
        orderBy: { createdAt: "desc" },
        include: { plan: { select: { name: true } } },
      },
    },
  });
}

export async function getSubscriptionDistribution() {
  await requireAdmin();
  const plans = await prisma.plan.findMany({
    include: { _count: { select: { subscriptions: true } } },
  });
  return plans.map((plan) => ({
    name: plan.name,
    value: plan._count.subscriptions,
  }));
}

// === Financials ===

export async function getFinancialData() {
  await requireAdmin();
  const [totalRevenueAgg, revenueByPayment, settledBills, unsettledBills, orderStats] = await Promise.all([
    prisma.order.aggregate({
      where: { status: { not: "CANCELLED" } },
      _sum: { totalAmount: true },
    }),
    prisma.bill.groupBy({
      by: ["paymentMethod"],
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.bill.aggregate({
      where: { settledAt: { not: null } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.bill.aggregate({
      where: { settledAt: null },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { status: { not: "CANCELLED" } },
      _avg: { totalAmount: true },
      _count: true,
    }),
  ]);

  const totalOrderItems = await prisma.orderItem.count();
  const totalOrders = orderStats._count || 1;

  return {
    totalRevenue: totalRevenueAgg._sum.totalAmount || 0,
    revenueByPayment: revenueByPayment.map((r) => ({
      method: r.paymentMethod,
      amount: r._sum.totalAmount || 0,
      count: r._count,
    })),
    billsByStatus: [
      { status: "SETTLED", amount: settledBills._sum.totalAmount || 0, count: settledBills._count },
      { status: "PENDING", amount: unsettledBills._sum.totalAmount || 0, count: unsettledBills._count },
    ],
    avgOrderValue: orderStats._avg.totalAmount || 0,
    totalOrders,
    avgItemsPerOrder: totalOrders > 0 ? Math.round((totalOrderItems / totalOrders) * 100) / 100 : 0,
    totalOrderItems,
  };
}

// === Subscriptions ===

export async function getSubscriptionsOverview() {
  await requireAdmin();
  const [totalSubscriptions, activeSubscriptions, plans, allSubscriptions] = await Promise.all([
    prisma.subscription.count(),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.plan.findMany(),
    prisma.subscription.findMany({
      include: {
        plan: true,
        restaurant: { select: { name: true, logoUrl: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const inactiveSubscriptions = totalSubscriptions - activeSubscriptions;
  const churnRate = totalSubscriptions > 0 ? inactiveSubscriptions / totalSubscriptions : 0;

  const planMap = new Map(plans.map((p) => [p.id, p]));
  const activeSubs = allSubscriptions.filter((s) => s.status === "ACTIVE");
  const mrr = activeSubs.reduce((sum, s) => {
    const plan = planMap.get(s.planId);
    return sum + (plan?.monthlyPrice || 0);
  }, 0);

  const now = new Date();
  const upcomingRenewals = allSubscriptions.filter((s) => {
    const daysUntilEnd = (s.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return s.status === "ACTIVE" && daysUntilEnd >= 0 && daysUntilEnd <= 30;
  }).sort((a, b) => a.endDate.getTime() - b.endDate.getTime());

  const mrrTrend = [];
  for (let i = 11; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const activeInMonth = allSubscriptions.filter((s) => {
      const start = new Date(s.startDate);
      const end = new Date(s.endDate);
      return start <= monthEnd && end >= monthStart && s.status === "ACTIVE";
    });
    const monthlyRevenue = activeInMonth.reduce((sum, s) => {
      const plan = planMap.get(s.planId);
      return sum + (plan?.monthlyPrice || 0);
    }, 0);
    mrrTrend.push({
      month: monthStart.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      revenue: monthlyRevenue,
    });
  }

  return {
    totalSubscriptions,
    activeSubscriptions,
    inactiveSubscriptions,
    churnRate,
    mrr,
    mrrTrend,
    upcomingRenewals,
    allSubscriptions,
    plans,
  };
}

export async function getFailedPayments() {
  await requireAdmin();
  const failedBills = await prisma.bill.findMany({
    where: { settledAt: null },
    include: {
      order: { include: { restaurant: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return failedBills.map((b) => ({
    id: b.id,
    restaurant: b.order?.restaurant?.name || "Unknown",
    amount: b.totalAmount,
    date: b.createdAt,
    method: b.paymentMethod,
    billNumber: b.billNumber,
  }));
}

// === Analytics ===

function getPeriodDate(period: string): Date {
  const now = new Date();
  switch (period) {
    case "7D":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30D":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "90D":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case "1Y":
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

export async function getAnalyticsOverview(period: string) {
  await requireAdmin();
  const periodStart = getPeriodDate(period);
  const periodEnd = new Date();

  const [
    totalRestaurants,
    totalOrders,
    totalRevenueAgg,
    ordersInPeriod,
    revenueByMonth,
    restaurantsByType,
    paymentDist,
    ordersByHour,
  ] = await Promise.all([
    prisma.restaurant.count({ where: { isActive: true } }),
    prisma.order.count({ where: { status: { not: "CANCELLED" } } }),
    prisma.order.aggregate({
      where: { status: { not: "CANCELLED" } },
      _sum: { totalAmount: true },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: periodStart, lte: periodEnd }, status: { not: "CANCELLED" } },
      select: { totalAmount: true, createdAt: true, restaurant: { select: { type: true, city: true } } },
    }),
    prisma.order.groupBy({
      by: ["createdAt"],
      where: { createdAt: { gte: periodStart, lte: periodEnd }, status: { not: "CANCELLED" } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.restaurant.groupBy({
      by: ["type"],
      _count: true,
    }),
    prisma.bill.groupBy({
      by: ["paymentMethod"],
      _sum: { totalAmount: true },
      _count: true,
      where: { createdAt: { gte: periodStart, lte: periodEnd } },
    }),
    prisma.order.groupBy({
      by: ["createdAt"],
      where: { createdAt: { gte: periodStart, lte: periodEnd }, status: { not: "CANCELLED" } },
      _count: true,
    }),
  ]);

  const avgOrderValue = totalOrders > 0 ? (totalRevenueAgg._sum.totalAmount || 0) / totalOrders : 0;

  const revenueMap = new Map<string, number>();
  ordersInPeriod.forEach((o) => {
    const key = o.createdAt.toISOString().slice(0, 10);
    revenueMap.set(key, (revenueMap.get(key) || 0) + o.totalAmount);
  });
  const revenueOverTime = Array.from(revenueMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({ date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }), amount }));

  // Restaurant types (cuisines)
  const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];
  const cuisineData = restaurantsByType.map((r, i) => ({
    name: r.type.replace(/_/g, " "),
    value: r._count,
    color: COLORS[i % COLORS.length],
  }));

  // Payment method distribution
  const paymentColors: Record<string, string> = {
    CASH: "#10b981",
    CARD: "#6366f1",
    MOBILE: "#f59e0b",
    QR: "#8b5cf6",
    ONLINE: "#ec4899",
  };
  const paymentData = paymentDist.map((p) => ({
    name: p.paymentMethod,
    value: p._sum.totalAmount || 0,
    count: p._count,
    color: paymentColors[p.paymentMethod] || "#6366f1",
  }));

  // Top cities by revenue
  const cityRevenueMap = new Map<string, number>();
  ordersInPeriod.forEach((o) => {
    const city = o.restaurant?.city || "Unknown";
    cityRevenueMap.set(city, (cityRevenueMap.get(city) || 0) + o.totalAmount);
  });
  const cityData = Array.from(cityRevenueMap.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([city, amount]) => ({ city, amount }));

  // Peak hours
  const hourCounts = new Array(24).fill(0);
  ordersByHour.forEach((o) => {
    const hour = new Date(o.createdAt).getHours();
    hourCounts[hour] += o._count;
  });
  const hourLabels = [
    "12AM", "1AM", "2AM", "3AM", "4AM", "5AM", "6AM", "7AM", "8AM", "9AM", "10AM", "11AM",
    "12PM", "1PM", "2PM", "3PM", "4PM", "5PM", "6PM", "7PM", "8PM", "9PM", "10PM", "11PM",
  ];
  const peakHoursData = hourCounts.map((count, i) => ({ hour: hourLabels[i], orders: count }));

  // Feature adoption
  const totalActive = await prisma.restaurant.count({ where: { isActive: true } });
  const [qrMenuCount, onlineOrderingCount, totalWithUsers, totalWithInventory] = await Promise.all([
    prisma.restaurant.count({ where: { isActive: true, enableQRMenu: true } }),
    prisma.restaurant.count({ where: { isActive: true, enableQRMenu: true } }),
    prisma.restaurant.count({ where: { isActive: true, users: { some: {} } } }),
    prisma.restaurant.count({ where: { isActive: true, inventory: { some: {} } } }),
  ]);
  const featureData = [
    { name: "QR Menu", adoption: totalActive > 0 ? (qrMenuCount / totalActive) * 100 : 0, fill: "#6366f1" },
    { name: "Online Ordering", adoption: totalActive > 0 ? (onlineOrderingCount / totalActive) * 100 : 0, fill: "#10b981" },
    { name: "Team Accounts", adoption: totalActive > 0 ? (totalWithUsers / totalActive) * 100 : 0, fill: "#f59e0b" },
    { name: "Inventory Mgmt", adoption: totalActive > 0 ? (totalWithInventory / totalActive) * 100 : 0, fill: "#8b5cf6" },
  ];

  return {
    totalRestaurants,
    totalOrders,
    totalRevenue: totalRevenueAgg._sum.totalAmount || 0,
    avgOrderValue,
    revenueOverTime,
    cuisineData,
    paymentData,
    cityData,
    peakHoursData,
    featureData,
    periodOrders: ordersInPeriod.length,
    periodRevenue: ordersInPeriod.reduce((sum, o) => sum + o.totalAmount, 0),
  };
}

// === Settings ===

export async function getAdminUsers() {
  await requireAdmin();
  const users = await prisma.user.findMany({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  const roleGroups = [
    { name: "Super Admin", color: "#ef4444", permissions: ["Full system access", "User management", "Billing", "Analytics"] },
    { name: "Admin", color: "#f59e0b", permissions: ["Restaurant management", "User management", "Analytics"] },
    { name: "Support", color: "#6366f1", permissions: ["Ticket management", "User support", "Read analytics"] },
    { name: "Viewer", color: "#10b981", permissions: ["Read-only access", "View reports"] },
  ].map((role) => ({
    ...role,
    memberCount: users.filter((u) => u.role === role.name.toUpperCase().replace(" ", "_") || u.role === "ADMIN" && role.name === "Admin").length,
  }));

  return { users, roleGroups };
}

export async function getPlatformStats() {
  await requireAdmin();
  const [totalRestaurants, totalUsers, totalOrders, totalMenuItems, totalStaff] = await Promise.all([
    prisma.restaurant.count(),
    prisma.user.count(),
    prisma.order.count(),
    prisma.menuItem.count(),
    prisma.staff.count(),
  ]);
  return { totalRestaurants, totalUsers, totalOrders, totalMenuItems, totalStaff };
}

// === Support ===

export async function getSupportQuickStats() {
  await requireAdmin();
  const [totalRestaurants, activeRestaurants, totalOrders, monthlyOrders, totalNotifications] = await Promise.all([
    prisma.restaurant.count(),
    prisma.restaurant.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.order.count({
      where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
    }),
    prisma.notification.count({ where: { createdAt: { gte: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000) } } }),
  ]);

  return { totalRestaurants, activeRestaurants, totalOrders, monthlyOrders, totalNotifications };
}

export async function getRecentNotifications() {
  await requireAdmin();
  return prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      restaurant: { select: { name: true } },
      user: { select: { firstName: true, lastName: true } },
    },
  });
}

// Platform-wide unread count, used for the superadmin header's notification
// bell badge (C1 — previously the bell had no badge/count at all).
export async function getUnreadNotificationCount() {
  await requireAdmin();
  return prisma.notification.count({ where: { isRead: false } });
}

// Mass Communication (Support Center) — previously "Send" had no handler at
// all. Real email/SMS delivery infrastructure doesn't exist in this app, so
// this creates real in-app Notification rows for every user of every
// targeted restaurant, which is the one channel that's actually wired up
// end-to-end (users see it via the existing notification system). The UI
// reports honestly that delivery is in-app, regardless of which "channel"
// was selected in the form.
export async function sendMassCommunication(input: {
  audience: "all" | "plan" | "city";
  audienceValue?: string;
  subject: string;
  message: string;
}) {
  await requireAdmin();
  if (!input.subject?.trim() || !input.message?.trim()) {
    return { error: "Subject and message are required" };
  }

  const restaurantWhere: any = { isActive: true };
  if (input.audience === "city" && input.audienceValue) {
    restaurantWhere.city = input.audienceValue;
  }
  if (input.audience === "plan" && input.audienceValue) {
    restaurantWhere.subscriptions = {
      some: { status: "ACTIVE", plan: { name: input.audienceValue } },
    };
  }

  const restaurants = await prisma.restaurant.findMany({
    where: restaurantWhere,
    select: { id: true, users: { select: { id: true } } },
  });

  const recipients = restaurants.flatMap((r) =>
    r.users.map((u) => ({
      recipientUserId: u.id,
      restaurantId: r.id,
      type: "ANNOUNCEMENT",
      title: input.subject.trim(),
      message: input.message.trim(),
    }))
  );

  if (recipients.length === 0) {
    return { error: "No matching restaurants with users found for that audience" };
  }

  await prisma.notification.createMany({ data: recipients });

  return { data: { restaurantCount: restaurants.length, recipientCount: recipients.length } };
}

// === Compliance ===

export async function getComplianceData() {
  await requireAdmin();
  const restaurants = await prisma.restaurant.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phoneNumber: true,
      gstNumber: true,
      isActive: true,
      city: true,
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const total = restaurants.length;
  const compliant = restaurants.filter((r) => r.isActive && r.email && r.phoneNumber).length;
  const actionRequired = restaurants.filter((r) => r.isActive && (!r.email || !r.phoneNumber)).length;
  const nonCompliant = total - compliant - actionRequired;

  const restaurantsWithDetails = restaurants.map((r) => ({
    ...r,
    complianceStatus: !r.isActive ? "Non-Compliant" : r.email && r.phoneNumber ? "Compliant" : "Action Required",
    panVatVerified: r.gstNumber ? "Yes" : "No",
  }));

  return {
    total,
    compliant,
    actionRequired,
    nonCompliant,
    restaurants: restaurantsWithDetails,
  };
}

// === Innovation ===

export async function getInnovationData() {
  await requireAdmin();
  const [activeRestaurants, totalOrders, totalRevenue, totalMenuItems, restaurantsByType] = await Promise.all([
    prisma.restaurant.count({ where: { isActive: true } }),
    prisma.order.count({ where: { status: { not: "CANCELLED" } } }),
    prisma.order.aggregate({
      where: { status: { not: "CANCELLED" } },
      _sum: { totalAmount: true },
    }),
    prisma.menuItem.count(),
    prisma.restaurant.groupBy({
      by: ["type"],
      _count: true,
    }),
  ]);

  const insights = [
    { title: "Active Restaurants", value: activeRestaurants.toString(), icon: "Building2", trend: "+12%", trendUp: true },
    { title: "Total Orders", value: totalOrders.toLocaleString(), icon: "ShoppingCart", trend: "+8%", trendUp: true },
    { title: "Total Revenue", value: `NPR ${Math.round(totalRevenue._sum.totalAmount || 0).toLocaleString()}`, icon: "TrendingUp", trend: "+15%", trendUp: true },
    { title: "Menu Items", value: totalMenuItems.toLocaleString(), icon: "UtensilsCrossed", trend: "+5%", trendUp: true },
  ];

  const benchmarks = restaurantsByType.map((r) => ({
    type: r.type.replace(/_/g, " "),
    count: r._count,
  }));

  return { insights, benchmarks };
}

// === Pipeline ===

export async function getPipelineData() {
  await requireAdmin();
  const [recentRestaurants, recentActivity, subscriptions, totalRestaurants] = await Promise.all([
    prisma.restaurant.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        city: true,
        isActive: true,
        createdAt: true,
        _count: { select: { orders: true, users: true, menuItems: true } },
      },
    }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { restaurant: { select: { name: true } } },
    }),
    prisma.subscription.findMany({
      include: {
        plan: { select: { name: true } },
        restaurant: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.restaurant.count(),
  ]);

  return { recentRestaurants, recentActivity, subscriptions, totalRestaurants };
}

// === Health ===

export async function getHealthData() {
  await requireAdmin();
  const [totalRestaurants, totalOrders, activeRestaurants, errorLogs, recentLogs] = await Promise.all([
    prisma.restaurant.count(),
    prisma.order.count(),
    prisma.restaurant.count({ where: { isActive: true } }),
    prisma.activityLog.findMany({
      where: { actionType: { contains: "error", mode: "insensitive" } },
      include: { restaurant: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      include: { restaurant: { select: { name: true } } },
      take: 20,
    }),
  ]);

  const errorByRestaurant = new Map<string, { name: string; errors: number }>();
  errorLogs.forEach((log) => {
    const name = log.restaurant?.name || "Unknown";
    const existing = errorByRestaurant.get(log.restaurantId);
    if (existing) {
      existing.errors++;
    } else {
      errorByRestaurant.set(log.restaurantId, { name, errors: 1 });
    }
  });
  const errorRates = Array.from(errorByRestaurant.entries())
    .map(([id, data]) => ({ id, name: data.name, errors: data.errors }))
    .sort((a, b) => b.errors - a.errors)
    .slice(0, 5);

  return {
    totalRestaurants,
    totalOrders,
    activeRestaurants,
    errorRates,
    recentAlerts: recentLogs.map((l) => ({
      id: l.id,
      type: l.actionType,
      title: l.description,
      restaurant: l.restaurant?.name || "System",
      createdAt: l.createdAt,
    })),
  };
}

// === Restaurant Detail ===

export async function getRestaurantFullDetail(id: string) {
  await requireAdmin();
  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      _count: { select: { users: true, tables: true, menuItems: true, orders: true, staff: true, inventory: true } },
      subscriptions: { include: { plan: true }, orderBy: { createdAt: "desc" }, take: 1 },
      operatingHours: true,
      kpiCards: true,
    },
  });

  if (!restaurant) return null;

  const [orders, bills, staff, tables, notifications, activityLogs] = await Promise.all([
    prisma.order.findMany({
      where: { restaurantId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { items: true },
    }),
    prisma.bill.findMany({
      where: { restaurantId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { order: { select: { orderId: true } } },
    }),
    prisma.staff.findMany({
      where: { restaurantId: id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.restaurantTable.findMany({
      where: { restaurantId: id },
      orderBy: { tableNumber: "asc" },
    }),
    prisma.notification.findMany({
      where: { restaurantId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.activityLog.findMany({
      where: { restaurantId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { restaurant: { select: { name: true } } },
    }),
  ]);

  return { restaurant, orders, bills, staff, tables, notifications, activityLogs };
}
