import { Suspense } from 'react';
import {
  getDashboardStats,
  getRecentOrders,
  getRevenueChartData,
  getTopSellingItems,
  getRecentActivity,
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
  const [stats, orders, chartData, topItems, activities] = await Promise.all([
    restaurantId
      ? getDashboardStats(restaurantId).catch(() => null)
      : Promise.resolve(null),
    restaurantId
      ? getRecentOrders(restaurantId, 10).catch(() => [])
      : Promise.resolve([]),
    restaurantId
      ? getRevenueChartData(restaurantId, 'week').catch(() => [])
      : Promise.resolve([]),
    restaurantId
      ? getTopSellingItems(restaurantId).catch(() => [])
      : Promise.resolve([]),
    restaurantId
      ? getRecentActivity(restaurantId).catch(() => [])
      : Promise.resolve([]),
  ]);

  return (
    <DashboardClient
      stats={stats}
      orders={orders}
      chartData={chartData}
      topItems={topItems}
      activities={activities}
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
