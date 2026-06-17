'use client';

import { create } from 'zustand';
import { CartItem, MenuItem } from '@/types';

interface CartStoreState {
  items: CartItem[];
  restaurantId: string | null;
  tableId: string | null;
  specialInstructions: string;
  addItem: (menuItem: MenuItem, quantity: number) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  addNote: (menuItemId: string, note: string) => void;
  setSpecialInstructions: (instructions: string) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
  getTax: (taxPercentage: number) => number;
  getTotal: (taxPercentage: number) => number;
}

export const useCartStore = create<CartStoreState>((set, get) => ({
  items: [],
  restaurantId: null,
  tableId: null,
  specialInstructions: '',

  addItem: (menuItem, quantity) => {
    set((state) => {
      const existingItem = state.items.find(
        (item) => item.menuItemId === menuItem.id
      );

      if (existingItem) {
        return {
          items: state.items.map((item) =>
            item.menuItemId === menuItem.id
              ? {
                  ...item,
                  quantity: item.quantity + quantity,
                  subtotal:
                    (item.quantity + quantity) *
                    (item.pricePerUnit +
                      item.selectedAddOns.reduce((sum, addon) => sum + addon.price, 0)),
                }
              : item
          ),
        };
      }

      const newItem: CartItem = {
        menuItemId: menuItem.id,
        menuItemName: menuItem.name,
        quantity,
        pricePerUnit: menuItem.price,
        selectedAddOns: [],
        subtotal: quantity * menuItem.price,
      };

      return {
        items: [...state.items, newItem],
      };
    });
  },

  removeItem: (menuItemId) => {
    set((state) => ({
      items: state.items.filter((item) => item.menuItemId !== menuItemId),
    }));
  },

  updateQuantity: (menuItemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(menuItemId);
      return;
    }

    set((state) => ({
      items: state.items.map((item) =>
        item.menuItemId === menuItemId
          ? {
              ...item,
              quantity,
              subtotal:
                quantity *
                (item.pricePerUnit +
                  item.selectedAddOns.reduce((sum, addon) => sum + addon.price, 0)),
            }
          : item
      ),
    }));
  },

  addNote: (menuItemId, note) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.menuItemId === menuItemId
          ? { ...item, specialInstructions: note }
          : item
      ),
    }));
  },

  setSpecialInstructions: (instructions) => {
    set({ specialInstructions: instructions });
  },

  clearCart: () => {
    set({
      items: [],
      restaurantId: null,
      tableId: null,
      specialInstructions: '',
    });
  },

  getItemCount: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },

  getSubtotal: () => {
    return get().items.reduce((total, item) => total + item.subtotal, 0);
  },

  getTax: (taxPercentage) => {
    const subtotal = get().getSubtotal();
    return (subtotal * taxPercentage) / 100;
  },

  getTotal: (taxPercentage) => {
    const subtotal = get().getSubtotal();
    const tax = (subtotal * taxPercentage) / 100;
    return subtotal + tax;
  },
}));
