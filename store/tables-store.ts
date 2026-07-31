'use client';

import { create } from 'zustand';
import { RestaurantTable, TableStatus } from '@/types';

interface TablesStoreState {
  tables: RestaurantTable[];
  selectedSpace: string | null;
  setTables: (tables: RestaurantTable[]) => void;
  updateTableStatus: (tableId: string, status: TableStatus) => void;
  setSelectedSpace: (space: string | null) => void;
  getTablesBySpace: (space: string) => RestaurantTable[];
  getTablesByStatus: (status: TableStatus) => RestaurantTable[];
}

export const useTablesStore = create<TablesStoreState>((set, get) => ({
  tables: [],
  selectedSpace: null,

  setTables: (tables) => {
    set({ tables });
  },

  updateTableStatus: (tableId, status) => {
    set((state) => ({
      tables: state.tables.map((table) =>
        table.id === tableId
          ? {
              ...table,
              status,
              updatedAt: new Date(),
              occupiedSince: status === 'OCCUPIED' ? new Date() : undefined,
            }
          : table
      ),
    }));
  },

  setSelectedSpace: (space) => {
    set({ selectedSpace: space });
  },

  getTablesBySpace: (space) => {
    return get().tables.filter((table) => table.location === space);
  },

  getTablesByStatus: (status) => {
    return get().tables.filter((table) => table.status === status);
  },
}));
