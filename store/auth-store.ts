'use client';

import { create } from 'zustand';
import { User, Restaurant } from '@/types';
import { supabase } from '@/lib/supabase';

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
      await supabase.auth.signOut();
      set({
        user: null,
        restaurant: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
      set({ isLoading: false });
    }
  },

  initialize: async () => {
    set({ isLoading: true });
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        // Fetch user profile and restaurant data from your database
        // This is a placeholder - adjust based on your API structure
        const user: User = {
          id: session.user.id,
          email: session.user.email || '',
          firstName: '',
          lastName: '',
          phoneNumber: '',
          role: 'STAFF',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));
