import { Suspense } from 'react';
import {
  getDashboardStats,
  getRecentOrders,
  getRevenueChartData,
  getTopSellingItems,
  getRecentActivity,
  getTableOverview,
  getRecentTransactions,
} from '@/lib/actions/dashboard';
import DashboardClient from './client';
import {
  DashboardPageSkeleton,
} from '@/components/dashboard/skeletons';
import { getSession } from '@/lib/auth';

// Resolve the real restaurantId from the JWT session
async function getRestaurantId(): Promise<string | null> {
  try {
    const session = await getSession();
    return session?.restaurantId ?? null;
  } catch {
    return null;
  }
}

// Inner async component — this is what Suspense wraps.
// Each data call is independent and cached, so they resolve in parallel.
async function DashboardData() {
  const restaurantId = await getRestaurantId();

  // All five queries fire in parallel; individual failures are isolated.
  const errors: string[] = [];
  const [stats, orders, chartData, topItems, activities, tables, transactions] = await Promise.all([
    restaurantId
      ? getDashboardStats(restaurantId).catch((e) => { errors.push(`Stats: ${e?.message || e}`); return null; })
      : Promise.resolve(null),
    restaurantId
      ? getRecentOrders(restaurantId, 10).catch((e) => { errors.push(`Orders: ${e?.message || e}`); return []; })
      : Promise.resolve([]),
    restaurantId
      ? getRevenueChartData(restaurantId, 'week').catch((e) => { errors.push(`Chart: ${e?.message || e}`); return []; })
      : Promise.resolve([]),
    restaurantId
      ? getTopSellingItems(restaurantId).catch((e) => { errors.push(`Top items: ${e?.message || e}`); return []; })
      : Promise.resolve([]),
    restaurantId
      ? getRecentActivity(restaurantId).catch((e) => { errors.push(`Activity: ${e?.message || e}`); return []; })
      : Promise.resolve([]),
    restaurantId
      ? getTableOverview(restaurantId).catch((e) => { errors.push(`Tables: ${e?.message || e}`); return []; })
      : Promise.resolve([]),
    restaurantId
      ? getRecentTransactions(restaurantId).catch((e) => { errors.push(`Transactions: ${e?.message || e}`); return []; })
      : Promise.resolve([]),
  ]);

  return (
    <DashboardClient
      stats={stats}
      orders={orders}
      chartData={chartData}
      topItems={topItems}
      activities={activities}
      tables={tables}
      transactions={transactions}
      errors={errors}
    />
  );
}

// Page — immediately returns the skeleton, then streams DashboardData in.
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardPageSkeleton />}>
      <DashboardData />
    </Suspense>
  );
}
