"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "./logs";
import { validatePhone } from "@/lib/phone-validator";

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
        // Resolve the pack by plan *type* (the stable tier identity the whole
        // platform gates on), not the marketing `name` — e.g. the PRO tier is
        // named "Enterprise", which would misreport the column.
        include: { plan: { select: { type: true } } },
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
  const [qrMenuCount, totalWithUsers, totalWithInventory] = await Promise.all([
    prisma.restaurant.count({ where: { isActive: true, enableQRMenu: true } }),
    prisma.restaurant.count({ where: { isActive: true, users: { some: {} } } }),
    prisma.restaurant.count({ where: { isActive: true, inventory: { some: {} } } }),
  ]);
  const featureData = [
    { name: "QR Menu", adoption: totalActive > 0 ? (qrMenuCount / totalActive) * 100 : 0, fill: "#6366f1" },
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
  const [totalRestaurants, activeRestaurants, totalOrders, monthlyOrders] = await Promise.all([
    prisma.restaurant.count(),
    prisma.restaurant.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.order.count({
      where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
    }),
  ]);

  return { totalRestaurants, activeRestaurants, totalOrders, monthlyOrders };
}

// Broadcast history for the Support Center. sendMassCommunication() fans one
// broadcast out into many per-user ANNOUNCEMENT Notification rows in a single
// createMany, so rows from the same broadcast share title+message and a
// near-identical timestamp. We collapse them back into one row per broadcast
// (bucketed by title|message|minute) with recipient / restaurant counts. This
// deliberately never surfaces the operational notifications (food-ready, order
// alerts, etc.) that a platform admin has no reason to see.
export async function getSentAnnouncements() {
  await requireAdmin();
  const rows = await prisma.notification.findMany({
    where: { type: "ANNOUNCEMENT" },
    orderBy: { createdAt: "desc" },
    take: 500,
    select: { title: true, message: true, restaurantId: true, createdAt: true },
  });

  const groups = new Map<string, {
    subject: string;
    message: string;
    sentAt: Date;
    recipientCount: number;
    restaurantIds: Set<string>;
  }>();

  for (const r of rows) {
    const minute = new Date(r.createdAt);
    minute.setSeconds(0, 0);
    const key = JSON.stringify([r.title, r.message, minute.getTime()]);
    const existing = groups.get(key);
    if (existing) {
      existing.recipientCount++;
      existing.restaurantIds.add(r.restaurantId);
      if (r.createdAt > existing.sentAt) existing.sentAt = r.createdAt;
    } else {
      groups.set(key, {
        subject: r.title,
        message: r.message,
        sentAt: r.createdAt,
        recipientCount: 1,
        restaurantIds: new Set([r.restaurantId]),
      });
    }
  }

  return Array.from(groups.values())
    .map((g) => ({
      subject: g.subject,
      message: g.message,
      sentAt: g.sentAt,
      recipientCount: g.recipientCount,
      restaurantCount: g.restaurantIds.size,
    }))
    .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
}

// Platform "attention" signal for the superadmin header bell: active restaurants
// missing contact details — the same "Action Required" criteria as
// getComplianceData. Replaces the old platform-wide unread-notification count,
// which only surfaced restaurant-staff operational alerts irrelevant to an admin.
export async function getAdminAttentionCount() {
  await requireAdmin();

  return prisma.restaurant.count({
    where: {
      isActive: true,
      OR: [{ email: "" }, { phoneNumber: "" }],
    },
  });
}

export async function getSuperadminNotifications() {
  await requireAdmin();

  const [openTickets, recentAnnouncements] = await Promise.all([
    prisma.supportTicket.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        restaurant: { select: { name: true } },
        user: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.notification.findMany({
      where: { type: "ANNOUNCEMENT" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, message: true, createdAt: true },
      distinct: ["title"],
    }),
  ]);

  return { openTickets, recentAnnouncements };
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
    { title: "Active Restaurants", value: activeRestaurants.toString(), icon: "Building2" },
    { title: "Total Orders", value: totalOrders.toLocaleString(), icon: "ShoppingCart" },
    { title: "Total Revenue", value: `NPR ${Math.round(totalRevenue._sum.totalAmount || 0).toLocaleString()}`, icon: "TrendingUp" },
    { title: "Menu Items", value: totalMenuItems.toLocaleString(), icon: "UtensilsCrossed" },
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

  const [orders, bills, staff, tables, owner, activityLogs] = await Promise.all([
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
    // The restaurant's owner login — powers the "Controls" tab's owner-account
    // section. Operational per-restaurant notifications are deliberately no
    // longer fetched here: a platform admin has no reason to see them.
    prisma.user.findFirst({
      where: { restaurantId: id, role: "RESTAURANT_OWNER" },
      orderBy: { createdAt: "asc" },
      select: { id: true, firstName: true, lastName: true, email: true, username: true, isActive: true },
    }),
    prisma.activityLog.findMany({
      where: { restaurantId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { restaurant: { select: { name: true } } },
    }),
  ]);

  return { restaurant, orders, bills, staff, tables, owner, activityLogs };
}

// === Restaurant CRUD (superadmin Action column) ===

// Create a brand-new restaurant together with its owner login. A restaurant is
// useless without an account that can sign in and run it, so this provisions
// both in one transaction: the owner User (password hashed) and the Restaurant,
// mutually linked. The new restaurant starts active; the superadmin can close
// it later from the same Action menu.
export async function createRestaurantWithOwner(input: {
  name: string;
  type?: string;
  email?: string;
  phoneNumber?: string;
  city?: string;
  ownerFirstName: string;
  ownerLastName?: string;
  ownerEmail: string;
  ownerPassword: string;
}) {
  await requireAdmin();

  const name = input.name?.trim();
  const ownerEmail = input.ownerEmail?.trim().toLowerCase();
  const ownerFirstName = input.ownerFirstName?.trim();

  if (!name) return { error: "Restaurant name is required" };
  if (!ownerFirstName) return { error: "Owner first name is required" };
  if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(ownerEmail || "")) {
    return { error: "Owner email must be a valid Gmail address (e.g. name@gmail.com)" };
  }
  if (!input.ownerPassword || input.ownerPassword.length < 6) {
    return { error: "Owner password must be at least 6 characters" };
  }

  if (input.phoneNumber) {
    const phoneResult = validatePhone(input.phoneNumber);
    if (!phoneResult.valid) return { error: `Phone: ${phoneResult.error}` };
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email: ownerEmail } });
    if (existing) return { error: "An account with that owner email already exists" };

    const passwordHash = await bcrypt.hash(input.ownerPassword, 12);

    const restaurant = await prisma.$transaction(async (tx) => {
      const owner = await tx.user.create({
        data: {
          email: ownerEmail!,
          username: `${(ownerEmail!.split("@")[0] || "owner").replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase()}_${Math.random().toString(36).slice(2, 7)}`,
          passwordHash,
          firstName: ownerFirstName!,
          lastName: input.ownerLastName?.trim() || "",
          role: "RESTAURANT_OWNER",
          isActive: true,
        },
      });

      const created = await tx.restaurant.create({
        data: {
          ownerId: owner.id,
          name,
          type: input.type || "RESTAURANT",
          email: input.email?.trim() || "",
          phoneNumber: input.phoneNumber?.trim() || "",
          city: input.city?.trim() || "",
          isActive: true,
        },
      });

      await tx.user.update({
        where: { id: owner.id },
        data: { restaurantId: created.id },
      });

      return created;
    });

    revalidatePath("/superadmin/restaurants");
    return { data: { id: restaurant.id, name: restaurant.name } };
  } catch (err: any) {
    return { error: err?.message || "Failed to create restaurant" };
  }
}


// Open or close a restaurant. Closing it (isActive = false) is the platform
// admin's kill switch: login() and the portal guards both refuse every
// owner / receptionist / waiter tied to this restaurant while it's closed, so
// the whole team is locked out until an admin reopens it. Platform admins have
// no restaurant link of their own, so this never affects admin sign-in.
export async function setRestaurantStatus(id: string, isActive: boolean) {
  const session = await requireAdmin();
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      select: { id: true, name: true, isActive: true },
    });
    if (!restaurant) return { error: "Restaurant not found" };

    const updated = await prisma.restaurant.update({
      where: { id },
      data: { isActive },
      select: { id: true, isActive: true },
    });

    await logActivity(session, {
      restaurantId: id,
      actionType: isActive ? "RESTAURANT_ACTIVATED" : "RESTAURANT_CLOSED",
      entityType: "Restaurant",
      entityId: id,
      description: `Restaurant "${restaurant.name}" ${isActive ? "reopened" : "closed"} by platform admin`,
      changesBefore: { isActive: restaurant.isActive },
      changesAfter: { isActive },
    });

    revalidatePath("/superadmin/restaurants");
    revalidatePath(`/superadmin/restaurants/${id}`);
    return { data: updated };
  } catch (err: any) {
    return { error: err?.message || "Failed to update restaurant status" };
  }
}

// Edit a restaurant's core profile. Only the fields supplied are touched, so a
// partial form (e.g. just the phone number) leaves everything else intact.
export async function updateRestaurant(
  id: string,
  data: {
    name?: string;
    email?: string;
    phoneNumber?: string;
    street?: string;
    city?: string;
    state?: string;
    type?: string;
  }
) {
  const session = await requireAdmin();

  if (data.name !== undefined && !data.name.trim()) {
    return { error: "Name is required" };
  }

  if (data.phoneNumber) {
    const phoneResult = validatePhone(data.phoneNumber);
    if (!phoneResult.valid) return { error: `Phone: ${phoneResult.error}` };
  }

  try {
    const existing = await prisma.restaurant.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) return { error: "Restaurant not found" };

    const updated = await prisma.restaurant.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.email !== undefined ? { email: data.email.trim() } : {}),
        ...(data.phoneNumber !== undefined ? { phoneNumber: data.phoneNumber.trim() } : {}),
        ...(data.street !== undefined ? { street: data.street.trim() } : {}),
        ...(data.city !== undefined ? { city: data.city.trim() } : {}),
        ...(data.state !== undefined ? { state: data.state.trim() } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
      },
      select: { id: true, name: true, email: true, phoneNumber: true, street: true, city: true, state: true, type: true, isActive: true },
    });

    await logActivity(session, {
      restaurantId: id,
      actionType: "RESTAURANT_UPDATED",
      entityType: "Restaurant",
      entityId: id,
      description: `Restaurant "${updated.name}" profile updated by platform admin`,
    });

    revalidatePath("/superadmin/restaurants");
    revalidatePath(`/superadmin/restaurants/${id}`);
    return { data: updated };
  } catch (err: any) {
    return { error: err?.message || "Failed to update restaurant" };
  }
}

// Permanently delete a restaurant and everything that hangs off it. None of the
// relations declare ON DELETE CASCADE, so every dependent row is removed in
// foreign-key order inside a single transaction — the whole tenant is erased
// atomically, or nothing is. This also deletes the owner / reception / waiter
// user rows, since those accounts can't exist without their restaurant.
export async function deleteRestaurant(id: string) {
  await requireAdmin();
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
    if (!restaurant) return { error: "Restaurant not found" };

    await prisma.$transaction([
      // Leaf rows that reference other children (must go first).
      prisma.payment.deleteMany({ where: { bill: { restaurantId: id } } }),
      prisma.inventoryHistory.deleteMany({ where: { item: { restaurantId: id } } }),
      prisma.orderItem.deleteMany({ where: { order: { restaurantId: id } } }),
      prisma.addOn.deleteMany({ where: { menuItem: { restaurantId: id } } }),
      // Rows that reference orders / tables / menu items.
      prisma.bill.deleteMany({ where: { restaurantId: id } }),
      prisma.barTab.deleteMany({ where: { restaurantId: id } }),
      prisma.reservation.deleteMany({ where: { restaurantId: id } }),
      prisma.order.deleteMany({ where: { restaurantId: id } }),
      prisma.menuItem.deleteMany({ where: { restaurantId: id } }),
      prisma.category.deleteMany({ where: { restaurantId: id } }),
      prisma.inventoryItem.deleteMany({ where: { restaurantId: id } }),
      prisma.shift.deleteMany({ where: { restaurantId: id } }),
      prisma.restaurantTable.deleteMany({ where: { restaurantId: id } }),
      prisma.staff.deleteMany({ where: { restaurantId: id } }),
      prisma.notification.deleteMany({ where: { restaurantId: id } }),
      prisma.activityLog.deleteMany({ where: { restaurantId: id } }),
      prisma.kpiCard.deleteMany({ where: { restaurantId: id } }),
      prisma.waitlistEntry.deleteMany({ where: { restaurantId: id } }),
      prisma.customer.deleteMany({ where: { restaurantId: id } }),
      prisma.coupon.deleteMany({ where: { restaurantId: id } }),
      prisma.corporateAccount.deleteMany({ where: { restaurantId: id } }),
      prisma.taxRate.deleteMany({ where: { restaurantId: id } }),
      prisma.floor.deleteMany({ where: { restaurantId: id } }),
      prisma.operatingHours.deleteMany({ where: { restaurantId: id } }),
      prisma.subscription.deleteMany({ where: { restaurantId: id } }),
      prisma.user.deleteMany({ where: { restaurantId: id } }),
      prisma.restaurant.delete({ where: { id } }),
    ]);

    revalidatePath("/superadmin/restaurants");
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "Failed to delete restaurant" };
  }
}

// === Restaurant control: plan / features / owner account ===

// Assign or switch a restaurant's subscription plan. Follows the same
// find-or-update pattern as completeGoogleRegistration (lib/actions/auth.ts):
// reuse the most recent subscription row if one exists, otherwise create it. The
// superadmin can move any restaurant onto any plan in the catalog.
export async function setRestaurantPlan(
  restaurantId: string,
  planId: string,
  billingCycle: "MONTHLY" | "ANNUAL" = "MONTHLY"
) {
  const session = await requireAdmin();
  try {
    const [restaurant, plan] = await Promise.all([
      prisma.restaurant.findUnique({ where: { id: restaurantId }, select: { id: true, name: true } }),
      prisma.plan.findUnique({ where: { id: planId }, select: { id: true, name: true } }),
    ]);
    if (!restaurant) return { error: "Restaurant not found" };
    if (!plan) return { error: "Plan not found" };

    const existing = await prisma.subscription.findFirst({
      where: { restaurantId },
      orderBy: { createdAt: "desc" },
      include: { plan: { select: { name: true } } },
    });

    const now = new Date();
    const endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    if (existing) {
      await prisma.subscription.update({
        where: { id: existing.id },
        data: { planId, status: "ACTIVE", startDate: now, endDate, billingCycle },
      });
    } else {
      await prisma.subscription.create({
        data: { restaurantId, planId, status: "ACTIVE", startDate: now, endDate, billingCycle },
      });
    }

    await logActivity(session, {
      restaurantId,
      actionType: "RESTAURANT_PLAN_CHANGED",
      entityType: "Subscription",
      entityId: existing?.id || restaurantId,
      description: `Plan for "${restaurant.name}" set to ${plan.name} by platform admin`,
      changesBefore: { plan: existing?.plan?.name || null },
      changesAfter: { plan: plan.name, billingCycle },
    });

    revalidatePath("/superadmin/restaurants");
    revalidatePath(`/superadmin/restaurants/${restaurantId}`);
    return { data: { planId, planName: plan.name } };
  } catch (err: any) {
    return { error: err?.message || "Failed to set plan" };
  }
}

// Toggle a restaurant's feature flags. Only the flags that actually exist on the
// Restaurant model are exposed (enableQRMenu, enableGST); anything not supplied
// is left untouched.
export async function updateRestaurantFeatures(
  id: string,
  features: { enableQRMenu?: boolean; enableGST?: boolean }
) {
  const session = await requireAdmin();
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      select: { id: true, name: true, enableQRMenu: true, enableGST: true },
    });
    if (!restaurant) return { error: "Restaurant not found" };

    const updated = await prisma.restaurant.update({
      where: { id },
      data: {
        ...(features.enableQRMenu !== undefined ? { enableQRMenu: features.enableQRMenu } : {}),
        ...(features.enableGST !== undefined ? { enableGST: features.enableGST } : {}),
      },
      select: { id: true, enableQRMenu: true, enableGST: true },
    });

    await logActivity(session, {
      restaurantId: id,
      actionType: "RESTAURANT_FEATURES_UPDATED",
      entityType: "Restaurant",
      entityId: id,
      description: `Feature flags for "${restaurant.name}" updated by platform admin`,
      changesBefore: { enableQRMenu: restaurant.enableQRMenu, enableGST: restaurant.enableGST },
      changesAfter: { enableQRMenu: updated.enableQRMenu, enableGST: updated.enableGST },
    });

    revalidatePath(`/superadmin/restaurants/${id}`);
    return { data: updated };
  } catch (err: any) {
    return { error: err?.message || "Failed to update features" };
  }
}

// The restaurant's owner account (RESTAURANT_OWNER). Shared by the two
// owner-management actions below.
async function findRestaurantOwner(restaurantId: string) {
  return prisma.user.findFirst({
    where: { restaurantId, role: "RESTAURANT_OWNER" },
    orderBy: { createdAt: "asc" },
    select: { id: true, firstName: true, lastName: true, isActive: true },
  });
}

// Reset a restaurant owner's login password. Mirrors the hashing used everywhere
// else (bcrypt cost 12) and the 6-char minimum from auth.ts's resetPassword.
export async function resetRestaurantOwnerPassword(restaurantId: string, newPassword: string) {
  const session = await requireAdmin();
  if (!newPassword || newPassword.length < 6) {
    return { error: "New password must be at least 6 characters" };
  }
  try {
    const owner = await findRestaurantOwner(restaurantId);
    if (!owner) return { error: "This restaurant has no owner account" };

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: owner.id }, data: { passwordHash } });

    await logActivity(session, {
      restaurantId,
      actionType: "OWNER_PASSWORD_RESET",
      entityType: "User",
      entityId: owner.id,
      description: `Owner login password reset by platform admin`,
    });

    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "Failed to reset password" };
  }
}

// Activate or deactivate a restaurant owner's login. A deactivated owner
// (isActive = false) is refused by login() independently of the restaurant kill
// switch, so this locks out just the owner while receptionists / waiters keep
// working.
export async function setRestaurantOwnerActive(restaurantId: string, isActive: boolean) {
  const session = await requireAdmin();
  try {
    const owner = await findRestaurantOwner(restaurantId);
    if (!owner) return { error: "This restaurant has no owner account" };

    await prisma.user.update({ where: { id: owner.id }, data: { isActive } });

    await logActivity(session, {
      restaurantId,
      actionType: isActive ? "OWNER_ACTIVATED" : "OWNER_DEACTIVATED",
      entityType: "User",
      entityId: owner.id,
      description: `Owner login ${isActive ? "reactivated" : "deactivated"} by platform admin`,
    });

    revalidatePath(`/superadmin/restaurants/${restaurantId}`);
    return { data: { id: owner.id, isActive } };
  } catch (err: any) {
    return { error: err?.message || "Failed to update owner status" };
  }
}
