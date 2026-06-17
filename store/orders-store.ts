'use client';

import { create } from 'zustand';
import { Order, OrderStatus } from '@/types';

type FilterType = OrderStatus | 'ALL';

interface OrdersStoreState {
  orders: Order[];
  selectedOrder: Order | null;
  filter: FilterType;
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  selectOrder: (order: Order | null) => void;
  setFilter: (filter: FilterType) => void;
  getFilteredOrders: () => Order[];
}

export const useOrdersStore = create<OrdersStoreState>((set, get) => ({
  orders: [],
  selectedOrder: null,
  filter: 'ALL',

  setOrders: (orders) => {
    set({ orders });
  },

  addOrder: (order) => {
    set((state) => ({
      orders: [order, ...state.orders],
    }));
  },

  updateOrderStatus: (orderId, status) => {
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId
          ? { ...order, status, updatedAt: new Date() }
          : order
      ),
      selectedOrder:
        state.selectedOrder?.id === orderId
          ? { ...state.selectedOrder, status, updatedAt: new Date() }
          : state.selectedOrder,
    }));
  },

  selectOrder: (order) => {
    set({ selectedOrder: order });
  },

  setFilter: (filter) => {
    set({ filter });
  },

  getFilteredOrders: () => {
    const { orders, filter } = get();

    if (filter === 'ALL') {
      return orders;
    }

    return orders.filter((order) => order.status === filter);
  },
}));
