import React from 'react';
import { Metadata } from 'next';
import OrderPageClient from './_components/OrderPageClient';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getMenuItems, getCategories } from '@/lib/actions/menu';
import { getTables } from '@/lib/actions/tables';
import { MenuItem } from '@/types';

export const metadata: Metadata = {
  title: 'Waitstaff Order Entry | Resthru',
  description: 'Fast, mobile-optimized order entry system for waitstaff.',
};

export default async function OrderPage() {
  const session = await getSession();
  if (!session || !session.restaurantId) {
    redirect('/order/login');
  }

  const waiterName = [session.firstName, session.lastName].filter(Boolean).join(' ').trim()
    || session.username
    || 'Waiter';

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
