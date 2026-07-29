import React from 'react';
import { Metadata } from 'next';
import OrderPageClient from '@/app/reception/order/_components/OrderPageClient';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getMenuItems, getCategories } from '@/lib/actions/menu';
import { getTables } from '@/lib/actions/tables';
import { MenuItem } from '@/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'New Order | Resthru',
  description: 'Direct order entry from the owner console.',
};

// Owner-side order entry — reuses the exact reception order-entry UI so the two
// portals stay behaviourally identical. The shared session (session.restaurantId)
// means every action targets the owner's own restaurant.
export default async function OwnerOrderPage() {
  const session = await getSession();
  if (!session || !session.restaurantId) {
    redirect('/owner/login');
  }

  const waiterName = [session.firstName, session.lastName].filter(Boolean).join(' ').trim()
    || session.username
    || 'Owner';

  const [menuResult, categoriesResult, tablesResult] = await Promise.all([
    getMenuItems(session.restaurantId, { availableOnly: true }),
    getCategories(session.restaurantId),
    getTables(session.restaurantId),
  ]);

  const menuItems: MenuItem[] = (menuResult.data as unknown as MenuItem[]) || [];
  const categories = (categoriesResult.data || [])
    .filter((c: any) => c.isActive)
    .map((c: any) => ({ id: c.id, name: c.name }));
  const tables = (tablesResult.data || []).map((t: any) => ({
    id: t.id,
    tableNumber: t.tableNumber,
    status: t.status,
    capacity: t.capacity,
  }));

  return (
    <OrderPageClient
      menuItems={menuItems}
      categories={categories}
      tables={tables}
      waiterName={waiterName}
    />
  );
}
