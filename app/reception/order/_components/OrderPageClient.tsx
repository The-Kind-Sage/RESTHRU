'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWaiterOrderStore } from '@/store/waiter-order-store';
import OrderHeader, { PosCategory } from './OrderHeader';
import MenuGrid from './MenuGrid';
import ActiveOrderSheet from './ActiveOrderSheet';
import ActiveOrdersView from './ActiveOrdersView';
import TableSelectorModal, { PosTable } from './TableSelectorModal';
import ItemModifierModal from './ItemModifierModal';
import { MenuItem } from '@/types';

export type PosView = 'menu' | 'orders';

export default function OrderPageClient({
  menuItems,
  categories,
  tables,
  waiterName,
}: {
  menuItems: MenuItem[];
  categories: PosCategory[];
  tables: PosTable[];
  waiterName: string;
}) {
  const [view, setView] = useState<PosView>('menu');
  const searchParams = useSearchParams();
  const setOrderType = useWaiterOrderStore((s) => s.setOrderType);
  const setQuickBill = useWaiterOrderStore((s) => s.setQuickBill);

  // The "Add New Order" shortcuts pass the kind of order as ?type=. Applying it
  // here is what makes a delivery order actually record as DELIVERY instead of
  // falling back to dine-in — and clears any table left over from a previous
  // dine-in order, which would otherwise print on its docket and bill.
  const typeParam = searchParams.get('type');
  // ?quick=1 marks a counter sale: the cart bills the order straight away
  // instead of sending it to the kitchen.
  const quickParam = searchParams.get('quick') === '1';
  useEffect(() => {
    // Arriving without ?type= means a plain "New Order": start from dine-in
    // rather than inheriting the persisted type of whatever was ordered last.
    setOrderType(typeParam ? typeParam.toUpperCase() : 'DINE_IN');
    setQuickBill(quickParam);
  }, [typeParam, quickParam, setOrderType, setQuickBill]);

  return (
    <div className="flex flex-col h-[100dvh] w-full mx-auto bg-background overflow-hidden relative sm:border-x sm:border-border lg:max-w-3xl xl:max-w-5xl">
      {/* Header: search, category pills, view toggle */}
      <OrderHeader categories={categories} view={view} onViewChange={setView} waiterName={waiterName} />

      {/* Main area: menu for building an order, or the live orders board */}
      <main className="flex-1 overflow-y-auto pb-24">
        {view === 'menu' ? (
          <MenuGrid menuItems={menuItems} />
        ) : (
          <ActiveOrdersView />
        )}
      </main>

      {/* Cart sheet only makes sense while building an order */}
      {view === 'menu' && <ActiveOrderSheet />}

      {/* Modals */}
      <TableSelectorModal tables={tables} />
      <ItemModifierModal />
    </div>
  );
}
