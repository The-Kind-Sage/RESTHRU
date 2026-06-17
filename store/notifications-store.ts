'use client';

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface AppNotification {
  id: string;
  type: 'order' | 'stock' | 'bill' | 'system';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
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
    if (!supabase) return;
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (!error && data) {
      const notifications = data as AppNotification[];
      set({
        notifications,
        unreadCount: notifications.filter((n) => !n.is_read).length,
      });
    }
    set({ isLoading: false });
  },

  markRead: async (id: string) => {
    if (!supabase) return;
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      );
      return { notifications, unreadCount: notifications.filter((n) => !n.is_read).length };
    });
  },

  markAllRead: async (restaurantId: string) => {
    if (!supabase) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('restaurant_id', restaurantId)
      .eq('is_read', false);
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    }));
  },

  dismiss: (id: string) => {
    set((state) => {
      const notifications = state.notifications.filter((n) => n.id !== id);
      return { notifications, unreadCount: notifications.filter((n) => !n.is_read).length };
    });
  },
}));
