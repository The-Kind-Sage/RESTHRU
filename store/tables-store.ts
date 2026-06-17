'use client';

import { create } from 'zustand';
import { RestaurantTable, TableStatus } from '@/types';

interface TablesStoreState {
  tables: RestaurantTable[];
  selectedFloor: string | null;
  setTables: (tables: RestaurantTable[]) => void;
  updateTableStatus: (tableId: string, status: TableStatus) => void;
  setSelectedFloor: (floor: string | null) => void;
  getTablesByFloor: (floor: string) => RestaurantTable[];
  getTablesByStatus: (status: TableStatus) => RestaurantTable[];
}

export const useTablesStore = create<TablesStoreState>((set, get) => ({
  tables: [],
  selectedFloor: null,

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

  setSelectedFloor: (floor) => {
    set({ selectedFloor: floor });
  },

  getTablesByFloor: (floor) => {
    return get().tables.filter((table) => table.location === floor);
  },

  getTablesByStatus: (status) => {
    return get().tables.filter((table) => table.status === status);
  },
}));
