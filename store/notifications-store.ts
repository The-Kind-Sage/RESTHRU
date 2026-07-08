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
    const notifications = data as AppNotification[];
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
