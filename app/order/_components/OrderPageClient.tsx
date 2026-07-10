'use client';

import React, { useState } from 'react';
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
}: {
  menuItems: MenuItem[];
  categories: PosCategory[];
  tables: PosTable[];
}) {
  const [view, setView] = useState<PosView>('menu');

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-md mx-auto bg-gray-50 overflow-hidden relative sm:border-x sm:border-gray-200">
      {/* Header: search, category pills, view toggle */}
      <OrderHeader categories={categories} view={view} onViewChange={setView} />

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
