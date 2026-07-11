'use client';

import { create } from 'zustand';
import { Order, OrderStatus } from '@/types';
import { updateOrderStatus as updateOrderStatusAction } from '@/lib/actions/orders';
import { playAlertSound, triggerHaptic } from '@/lib/alert-utils';

export type KitchenTab = 'PENDING' | 'PREPARING' | 'READY';

interface KitchenState {
  activeTab: KitchenTab;
  setActiveTab: (tab: KitchenTab) => void;

  orders: Order[];
  setOrders: (orders: Order[]) => void;

  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;

  undoLastCompletion: () => Promise<void>;
  lastCompletedOrder: Order | null;

  // Item level checklist
  toggleItemCheck: (orderId: string, itemId: string) => void;
  checkedItems: Record<string, boolean>; // key: `${orderId}-${itemId}`

  // Prep Aggregator
  getPrepTotals: () => Record<string, number>;
}

export const useKitchenStore = create<KitchenState>((set, get) => ({
  activeTab: 'PENDING',
  setActiveTab: (tab) => set({ activeTab: tab }),

  orders: [],
  setOrders: (orders) => set({ orders }),

  addOrder: (order) =>
    set((state) => {
      playAlertSound();
      triggerHaptic();

      return { orders: [order, ...state.orders] };
    }),

  lastCompletedOrder: null,

  updateOrderStatus: async (orderId, status) => {
    const state = get();
    const orderIndex = state.orders.findIndex((o) => o.id === orderId);
    if (orderIndex === -1) return;

    const originalOrder = state.orders[orderIndex];

    // Optimistic update immediately so the UI feels instant
    const newOrders = [...state.orders];
    newOrders[orderIndex] = { ...originalOrder, status };
    set({
      orders: newOrders,
      lastCompletedOrder:
        status === OrderStatus.READY ? originalOrder : state.lastCompletedOrder,
    });

    // Persist to DB in the background
    const result = await updateOrderStatusAction(orderId, status);

    if (result.error) {
      // Rollback on failure
      console.error('Failed to update order status:', result.error);
      const rollbackOrders = [...get().orders];
      const rollbackIndex = rollbackOrders.findIndex((o) => o.id === orderId);
      if (rollbackIndex !== -1) {
        rollbackOrders[rollbackIndex] = originalOrder;
        set({
          orders: rollbackOrders,
          lastCompletedOrder:
            state.lastCompletedOrder?.id === orderId
              ? null
              : state.lastCompletedOrder,
        });
      }
    }
  },

  undoLastCompletion: async () => {
    const state = get();
    if (!state.lastCompletedOrder) return;

    const orderId = state.lastCompletedOrder.id;
    const previousStatus = OrderStatus.PREPARING;

    // Optimistic rollback in UI
    const newOrders = state.orders.map((o) =>
      o.id === orderId ? { ...o, status: previousStatus } : o
    );
    set({ orders: newOrders, lastCompletedOrder: null });

    // Persist rollback to DB
    const result = await updateOrderStatusAction(orderId, previousStatus);
    if (result.error) {
      console.error('Failed to undo order status:', result.error);
    }
  },

  checkedItems: {},
  toggleItemCheck: (orderId, itemId) =>
    set((state) => {
      const key = `${orderId}-${itemId}`;
      return {
        checkedItems: {
          ...state.checkedItems,
          [key]: !state.checkedItems[key],
        },
      };
    }),

  getPrepTotals: () => {
    const { orders } = get();
    const activeOrders = orders.filter(
      (o) => o.status === OrderStatus.PENDING || o.status === OrderStatus.PREPARING
    );

    const totals: Record<string, number> = {};
    activeOrders.forEach((order) => {
      order.items.forEach((item) => {
        totals[item.menuItemName] = (totals[item.menuItemName] || 0) + item.quantity;
      });
    });

    return totals;
  },
}));
