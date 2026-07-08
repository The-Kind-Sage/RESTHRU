'use client';

import { create } from 'zustand';
import { User, Restaurant } from '@/types';
import { logout as clearServerSession, getRestaurantFromSession, getUserFromSession } from '@/lib/actions/auth';

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
      const [restaurantData, userData] = await Promise.all([
        getRestaurantFromSession(),
        getUserFromSession(),
      ]);
      if (userData) {
        set({
          user: {
            id: userData.id,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role as User['role'],
            phoneNumber: '',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          restaurant: restaurantData
            ? { id: restaurantData.id, name: restaurantData.name } as any
            : null,
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
