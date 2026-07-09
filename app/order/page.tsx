import React from 'react';
import { Metadata } from 'next';
import OrderHeader from './_components/OrderHeader';
import MenuGrid from './_components/MenuGrid';
import ActiveOrderSheet from './_components/ActiveOrderSheet';
import TableSelectorModal from './_components/TableSelectorModal';
import ItemModifierModal from './_components/ItemModifierModal';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getMenuItems } from '@/lib/actions/menu';
import { MenuItem } from '@/types';

export const metadata: Metadata = {
  title: 'Waitstaff Order Entry | Resthru',
  description: 'Fast, mobile-optimized order entry system for waitstaff.',
};

export default async function OrderPage() {
  const session = await getSession();
  if (!session || !session.restaurantId) {
    redirect('/login');
  }

  const result = await getMenuItems(session.restaurantId);
  const menuItems: MenuItem[] = (result.data as unknown as MenuItem[]) || [];

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-md mx-auto bg-gray-50 overflow-hidden relative sm:border-x sm:border-gray-200">
      {/* 
        Header Area (Sticky)
        Includes Search, Category Pills, and offline indicator
      */}
      <OrderHeader />

      {/* 
        Main Menu Area (Scrollable)
        Takes remaining height, adds padding at bottom so last items aren't hidden by the cart sheet 
      */}
      <main className="flex-1 overflow-y-auto pb-24">
        <MenuGrid menuItems={menuItems} />
      </main>

      {/* 
        Bottom Sheet for Active Order 
      */}
      <ActiveOrderSheet />

      {/* 
        Modals 
      */}
      <TableSelectorModal />
      <ItemModifierModal />
    </div>
  );
}

