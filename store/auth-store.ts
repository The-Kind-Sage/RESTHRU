'use client';

import { create } from 'zustand';
import { User, Restaurant } from '@/types';
import { supabase } from '@/lib/supabase';
import { logout as clearServerSession } from '@/lib/actions/auth';

interface AuthStoreState {
  user: User | null;
  restaurant: Restaurant | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setRestaurant: (restaurant: Restaurant | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  restaurant: null,
  isLoading: false,
  isAuthenticated: false,

  setUser: (user) => {
    set({
      user,
      isAuthenticated: !!user,
    });
  },

  setRestaurant: (restaurant) => {
    set({ restaurant });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
      await clearServerSession();
      set({
        user: null,
        restaurant: null,
        isAuthenticated: false,
        isLoading: false,
      });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      set({ isLoading: false });
    }
  },

  initialize: async () => {
    set({ isLoading: true });
    try {
      if (!supabase) {
        set({ isLoading: false });
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        // Pull the real owner name from the restaurants table
        const { data: restaurantData } = await supabase
          .from('restaurants')
          .select('id, name, owner_id')
          .eq('owner_id', session.user.id)
          .maybeSingle();

        // The user's full name is stored in auth metadata set during signUp
        const meta = session.user.user_metadata || {};
        const rawName: string = meta.full_name || session.user.email || '';
        const parts = rawName.trim().split(' ');
        const firstName = parts[0] || '';
        const lastName = parts.slice(1).join(' ') || '';

        const user: User = {
          id: session.user.id,
          email: session.user.email || '',
          firstName,
          lastName,
          phoneNumber: meta.phone || '',
          role: 'STAFF',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set({
          user,
          restaurant: restaurantData
            ? { id: restaurantData.id, name: restaurantData.name } as any
            : null,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        // No valid session — clear any stale persisted tokens from storage
        // to prevent "Invalid Refresh Token" console errors from the SDK's refresh timer.
        await supabase.auth.signOut();
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      if (supabase) {
        await supabase.auth.signOut();
      }
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));
