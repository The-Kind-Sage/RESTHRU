import { Suspense } from 'react';
import { cookies } from 'next/headers';
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
import { createClient } from '@supabase/supabase-js';

// Resolve the real restaurantId server-side from the Supabase session cookie
// so we never fall back to the hardcoded "demo" string.
async function getRestaurantId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value
      ?? cookieStore.get(`sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`)?.value;

    if (!accessToken || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return null;
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('ownerId', user.id)
      .single();

    return restaurant?.id ?? null;
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
