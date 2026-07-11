'use client';

import { KitchenHeader } from './_components/KitchenHeader';
import { OrderCard } from './_components/OrderCard';
import { UndoSnackbar } from './_components/UndoSnackbar';
import { useKitchenStore } from '@/store/kitchen-store';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Order } from '@/types';
import { AnimatePresence } from 'framer-motion';
import { getKitchenOrders } from '@/lib/actions/orders';
import { Loader2, RefreshCw } from 'lucide-react';

const POLL_INTERVAL_MS = 10_000;

export default function ReceptionKitchenPage() {
  const { activeTab, orders, setOrders, addOrder } = useKitchenStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const previousOrderIds = useRef<Set<string>>(new Set());

  const fetchOrders = useCallback(async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    setError(null);

    const result = await getKitchenOrders();

    if (result.error) {
      setError(result.error);
      if (isInitial) setIsLoading(false);
      return;
    }

    const fetched = (result.data ?? []) as unknown as Order[];

    fetched.forEach((order) => {
      if (!previousOrderIds.current.has(order.id)) {
        if (!isInitial) addOrder(order);
        previousOrderIds.current.add(order.id);
      }
    });

    setOrders(fetched);
    if (isInitial) setIsLoading(false);
  }, [addOrder, setOrders]);

  useEffect(() => {
    setIsClient(true);
    fetchOrders(true);
    const interval = setInterval(() => fetchOrders(false), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  if (!isClient || isLoading) {
    return (
      <div className="flex flex-col h-full min-h-[60vh] items-center justify-center gap-4 text-slate-400">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="font-medium">Loading Kitchen View…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full min-h-[60vh] items-center justify-center gap-4 px-6 text-center">
        <span className="text-5xl">⚠️</span>
        <p className="text-red-500 font-semibold text-lg">Failed to load orders</p>
        <p className="text-slate-400 text-sm">{error}</p>
        <button
          onClick={() => fetchOrders(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-bold mt-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  const displayedOrders = orders.filter((o) => o.status === activeTab);

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-10rem)] bg-slate-100 dark:bg-black rounded-xl overflow-hidden border border-border">
      <KitchenHeader />
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 scroll-smooth">
        <AnimatePresence>
          {displayedOrders.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-70 pt-20">
              <span className="text-6xl mb-4">🍳</span>
              <p className="text-lg font-medium">No orders here</p>
              <p className="text-sm text-slate-500 mt-1">Refreshes every 10s</p>
            </div>
          ) : (
            displayedOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))
          )}
        </AnimatePresence>
      </div>
      <UndoSnackbar />
    </div>
  );
}
