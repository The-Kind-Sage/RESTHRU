import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MenuItem } from '@/types';

export type WaiterOrderState = 'DRAFT' | 'CONFIRMED' | 'LIVE_TRACKING';

export interface DraftOrderItem {
  id: string; // Unique ID for the cart item (in case of same menu item with different notes)
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

interface WaiterOrderStore {
  // State
  orderState: WaiterOrderState;
  draftItems: DraftOrderItem[];
  tableNumber: string | null;
  guestCount: number;
  searchQuery: string;
  selectedCategory: string | null;
  isOffline: boolean;
  
  // Actions
  setOrderState: (state: WaiterOrderState) => void;
  setTableInfo: (tableNumber: string, guestCount: number) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  setIsOffline: (status: boolean) => void;
  
  // Cart Actions
  addItem: (menuItem: MenuItem, quantity?: number, notes?: string) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateNotes: (id: string, notes: string) => void;
  clearDraft: () => void;
  
  // Computed (getters handled in components usually, but we can have helpers)
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useWaiterOrderStore = create<WaiterOrderStore>()(
  persist(
    (set, get) => ({
      orderState: 'DRAFT',
      draftItems: [],
      tableNumber: null,
      guestCount: 1,
      searchQuery: '',
      selectedCategory: null,
      isOffline: false,

      setOrderState: (state) => set({ orderState: state }),
      
      setTableInfo: (tableNumber, guestCount) => set({ tableNumber, guestCount }),
      
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      setSelectedCategory: (categoryId) => set({ selectedCategory: categoryId }),
      
      setIsOffline: (status) => set({ isOffline: status }),

      addItem: (menuItem, quantity = 1, notes = '') => {
        set((state) => {
          // Check if item already exists without notes
          const existingItemIndex = state.draftItems.findIndex(
            (item) => item.menuItem.id === menuItem.id && item.notes === notes
          );

          if (existingItemIndex >= 0) {
            const newItems = [...state.draftItems];
            newItems[existingItemIndex].quantity += quantity;
            return { draftItems: newItems };
          }

          return {
            draftItems: [
              ...state.draftItems,
              {
                id: Math.random().toString(36).substring(7), // Simple unique ID
                menuItem,
                quantity,
                notes,
              },
            ],
          };
        });
      },

      removeItem: (id) => {
        set((state) => ({
          draftItems: state.draftItems.filter((item) => item.id !== id),
        }));
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          draftItems: state.draftItems.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        }));
      },

      updateNotes: (id, notes) => {
        set((state) => ({
          draftItems: state.draftItems.map((item) =>
            item.id === id ? { ...item, notes } : item
          ),
        }));
      },

      clearDraft: () => set({ draftItems: [], orderState: 'DRAFT' }),

      getTotalItems: () => {
        return get().draftItems.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        // Uses the discounted price when set — matches what the server charges
        return get().draftItems.reduce(
          (total, item) =>
            total + (item.menuItem.discountPrice ?? item.menuItem.price) * item.quantity,
          0
        );
      },
    }),
    {
      name: 'waiter-order-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
      partialize: (state) => ({ 
        draftItems: state.draftItems, 
        tableNumber: state.tableNumber, 
        guestCount: state.guestCount,
        orderState: state.orderState 
      }), // only persist these fields
    }
  )
);
