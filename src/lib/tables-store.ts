'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Table } from './types';
import { useHydratedStore } from './orders-store';

interface TableState {
  tables: Table[];
  hydrated: boolean;
  addTable: (name: string) => void;
  deleteTable: (id: string) => void;
  updateTableName: (id: string, newName: string) => void;
  setHydrated: (hydrated: boolean) => void;
}

const initialTables: Table[] = Array.from({ length: 15 }, (_, i) => ({
  id: `T${i + 1}`,
  name: `Table ${i + 1}`,
}));

export const useTableStore = create(
  persist<TableState>(
    (set) => ({
      tables: initialTables,
      hydrated: false,
      addTable: (name) =>
        set((state) => {
          const newId = `T${Date.now()}`;
          const newTable: Table = { id: newId, name };
          return { tables: [...state.tables, newTable] };
        }),
      deleteTable: (id) =>
        set((state) => ({
          tables: state.tables.filter((table) => table.id !== id),
        })),
      updateTableName: (id, newName) =>
        set((state) => ({
          tables: state.tables.map((table) =>
            table.id === id ? { ...table, name: newName } : table
          ),
        })),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: 'table-storage',
      storage: createJSONStorage(() => localStorage),
       onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true);
        }
      }
    }
  )
);
