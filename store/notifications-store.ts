'use client';

import { create } from 'zustand';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/actions/notifications';

export interface AppNotification {
  id: string;
  type: 'order' | 'stock' | 'bill' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  /** Explicit destination for the panel's "View" button, when one was stored. */
  actionUrl?: string | null;
  /** Used to route by entity when no explicit actionUrl exists (e.g. "Order"). */
  relatedEntityType?: string | null;
}

/**
 * The database stores raw event types (NEW_ORDER, ORDER_READY, BILL_REQUESTED…)
 * while the UI groups them into four icon buckets. Without this mapping every
 * lookup missed and notifications rendered with an empty icon circle.
 */
function toUiType(dbType: string): AppNotification['type'] {
  const t = (dbType || '').toUpperCase();
  if (t.includes('ORDER')) return 'order';
  if (t.includes('BILL') || t.includes('PAYMENT')) return 'bill';
  if (t.includes('STOCK') || t.includes('INVENTORY')) return 'stock';
  return 'system';
}

interface NotificationsState {
  notifications: AppNotification[];
  isLoading: boolean;
  unreadCount: number;
  fetch: (restaurantId: string) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: (restaurantId: string) => Promise<void>;
  dismiss: (id: string) => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  isLoading: false,
  unreadCount: 0,

  fetch: async (restaurantId: string) => {
    set({ isLoading: true });
    const data = await getNotifications(restaurantId);
    const notifications: AppNotification[] = (data ?? []).map((n: any) => ({
      ...n,
      type: toUiType(n.type),
    }));
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.isRead).length,
      isLoading: false,
    });
  },

  markRead: async (id: string) => {
    await markNotificationRead(id);
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      );
      return { notifications, unreadCount: notifications.filter((n) => !n.isRead).length };
    });
  },

  markAllRead: async (restaurantId: string) => {
    await markAllNotificationsRead(restaurantId);
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },

  dismiss: (id: string) => {
    set((state) => {
      const notifications = state.notifications.filter((n) => n.id !== id);
      return { notifications, unreadCount: notifications.filter((n) => !n.isRead).length };
    });
  },
}));
