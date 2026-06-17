'use client';

import { create } from 'zustand';

interface UIStoreState {
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  commandOpen: boolean;
  toggleSidebar: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  setCommandOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStoreState>((set) => ({
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  commandOpen: false,

  toggleSidebar: () => {
    set((state) => ({
      sidebarCollapsed: !state.sidebarCollapsed,
    }));
  },

  setMobileMenuOpen: (open) => {
    set({ mobileMenuOpen: open });
  },

  setCommandOpen: (open) => {
    set({ commandOpen: open });
  },
}));
