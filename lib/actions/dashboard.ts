"use server";

import { cache } from "react";
import prisma from "@/lib/prisma";

// ─── Cached helpers ────────────────────────────────────────────────────────
// React cache() deduplicates identical calls within the same server-render.
// For aggregate data that barely changes per page-load, we also use
// Next.js unstable_cache with a 60-second revalidation window.
import { unstable_cache } from "next/cache";

// ─── Types ─────────────────────────────────────────────────────────────────
export type DashboardStats = {
  totalOrders: number;
  todayOrders: number;
  todayRevenue: number;
  activeTables: number;
  totalTables: number;
  pendingOrders: number;
  occupiedTables: number;
  availableTables: number;
};

export type RecentOrder = {
  id: string;
  orderId: string;
  status: string;
  totalAmount: number;
  createdAt: Date;
  table: { tableNumber: number } | null;
};

export type ChartPoint = { date: string; revenue: number };
export type TopItem    = { name: string; orders: number; revenue: number; percentage: number; isVeg: boolean };
export type Activity   = { id: string; type: "order" | "payment" | "cancelled"; title: string; time: Date };
export type TableOverviewItem = { id: string; tableNumber: number; status: string };

// ─── 1. Dashboard Stats ────────────────────────────────────────────────────
// Cached for 60 s — avoids recalculating aggregate counts on every navigation.
export const getDashboardStats = unstable_cache(
  async (restaurantId: string): Promise<DashboardStats> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // All counts run in a single Promise.all — no sequential waterfall.
    // totalTables was previously fetched AFTER the parallel block (bug).
    const [
      totalOrders,
      todayOrders,
      activeTables,
      totalTables,
      pendingOrders,
      todayRevenueAgg,
    ] = await Promise.all([
      prisma.order.count({ where: { restaurantId } }),
      prisma.order.count({ where: { restaurantId, createdAt: { gte: today } } }),
      prisma.restaurantTable.count({
        where: { restaurantId, status: { not: "AVAILABLE" } },
      }),
      prisma.restaurantTable.count({ where: { restaurantId } }),
      prisma.order.count({
        where: { restaurantId, status: { in: ["PENDING", "PREPARING"] } },
      }),
      prisma.order.aggregate({
        where: {
          restaurantId,
          createdAt: { gte: today },
          status: { not: "CANCELLED" },
        },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      totalOrders,
      todayOrders,
      todayRevenue: todayRevenueAgg._sum.totalAmount ?? 0,
      activeTables,
      totalTables,
      pendingOrders,
      occupiedTables: activeTables,
      availableTables: totalTables - activeTables,
    };
  },
  ["dashboard-stats"],
  { revalidate: 60 }
);

// ─── 2. Recent Orders — paginated, no N+1 ──────────────────────────────────
// Default limit dropped from 50 → 10. Callers pass page for cursor-based nav.
export const getRecentOrders = cache(
  async (restaurantId: string, limit = 10, cursor?: string): Promise<RecentOrder[]> => {
    return prisma.order.findMany({
      where: { restaurantId },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      // Only fetch the columns the UI actually uses — no items include
      select: {
        id: true,
        orderId: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        table: { select: { tableNumber: true } },
      },
    });
  }
);

// ─── 2b. Full Orders with Items — for the dashboard/orders page ────────────
// Includes items and special requests for the kanban detail view.
export const getOrdersWithItems = cache(
  async (restaurantId: string, limit = 50): Promise<any[]> => {
    const orders = await prisma.order.findMany({
      where: { restaurantId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        items: true,
        table: { select: { tableNumber: true } },
        bills: { select: { id: true } },
      },
    });
    return orders;
  }
);

// ─── 3. Revenue Chart — aggregated in DB, not in JS ────────────────────────
// Previously: fetched all matching orders into memory, grouped in JS (O(n)).
// Now: uses groupBy + _sum pushed to the database.
export const getRevenueChartData = unstable_cache(
  async (
    restaurantId: string,
    period: "week" | "month" = "week"
  ): Promise<ChartPoint[]> => {
    const days = period === "week" ? 7 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Raw SQL via $queryRaw to get date-truncated aggregates in one round-trip.
    // NOTE: uses the mapped physical names (@@map/@map) — table "orders", snake_case columns.
    const rows = await prisma.$queryRaw<{ day: Date; total: number }[]>`
      SELECT
        DATE_TRUNC('day', "created_at") AS day,
        COALESCE(SUM("total_amount"), 0)::float AS total
      FROM "orders"
      WHERE
        "restaurant_id" = ${restaurantId}
        AND "created_at" >= ${startDate}
        AND "status" != 'CANCELLED'
      GROUP BY day
      ORDER BY day ASC
    `;

    // Fill in missing days with 0 so the chart is always continuous.
    const map = new Map(
      rows.map((r) => [r.day.toISOString().split("T")[0], r.total])
    );
    const result: ChartPoint[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      result.push({ date: key, revenue: map.get(key) ?? 0 });
    }
    return result;
  },
  ["revenue-chart"],
  { revalidate: 120 }
);

// ─── 4. Top Selling Items ──────────────────────────────────────────────────
// Revenue = SUM(quantity × unit price), joined with menu_items for veg/non-veg.
export const getTopSellingItems = unstable_cache(
  async (restaurantId: string, limit = 5): Promise<TopItem[]> => {
    const rows = await prisma.$queryRaw<
      { name: string; orders: number; revenue: number; food_type: string | null }[]
    >`
      SELECT
        oi."menu_item_name" AS name,
        SUM(oi."quantity")::int AS orders,
        SUM(oi."quantity" * oi."price_per_unit")::float AS revenue,
        MAX(mi."food_type") AS food_type
      FROM "order_items" oi
      JOIN "orders" o ON o."id" = oi."order_id"
      LEFT JOIN "menu_items" mi ON mi."id" = oi."menu_item_id"
      WHERE o."restaurant_id" = ${restaurantId}
        AND o."status" != 'CANCELLED'
      GROUP BY oi."menu_item_name"
      ORDER BY orders DESC
      LIMIT ${limit}
    `;

    const maxOrders = rows[0]?.orders ?? 1;

    return rows.map((row) => ({
      name:       row.name,
      orders:     row.orders,
      revenue:    row.revenue,
      percentage: Math.round((row.orders / maxOrders) * 100),
      isVeg:      row.food_type !== "NON_VEG",
    }));
  },
  ["top-items"],
  { revalidate: 120 }
);

// ─── 4b. Table Overview — real per-table numbers + status for the Home grid ─
// The Home page's "Table Overview" grid used to render N generic squares
// (occupiedTables red, rest green) with no link to which physical table was
// occupied. This returns the actual tables so the grid can show real numbers.
export const getTableOverview = cache(
  async (restaurantId: string): Promise<TableOverviewItem[]> => {
    return prisma.restaurantTable.findMany({
      where: { restaurantId },
      orderBy: { tableNumber: "asc" },
      select: { id: true, tableNumber: true, status: true },
    });
  }
);

// ─── 5. Recent Activity — single query, interleaved in DB ──────────────────
export const getRecentActivity = cache(
  async (restaurantId: string, limit = 5): Promise<Activity[]> => {
    // Fetch orders and bills in parallel — already optimal.
    const [orders, bills] = await Promise.all([
      prisma.order.findMany({
        where: { restaurantId },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          orderId: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.bill.findMany({
        where: { restaurantId },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: { billNumber: true, totalAmount: true, createdAt: true },
      }),
    ]);

    const activities: Activity[] = [
      ...orders.map((o) => ({
        id:    `o-${o.id}`,
        type:  (o.status === "CANCELLED" ? "cancelled" : "order") as Activity["type"],
        title: o.status === "CANCELLED"
          ? `Order ${o.orderId} cancelled`
          : `Order ${o.orderId} placed`,
        time:  o.createdAt,
      })),
      ...bills.map((b) => ({
        id:    `b-${b.billNumber}`,
        type:  "payment" as Activity["type"],
        title: `Bill ${b.billNumber} paid — NPR ${b.totalAmount.toLocaleString()}`,
        time:  b.createdAt,
      })),
    ];

    return activities
      .sort((a, b) => b.time.getTime() - a.time.getTime())
      .slice(0, limit);
  }
);
