'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Table } from './types';

interface TableState {
  tables: Table[];
  hydrated: boolean;
  addTable: (name: string, section: string) => void;
  deleteTable: (id: string) => void;
  updateTable: (id: string, newName: string, newSection: string) => void;
  setHydrated: (hydrated: boolean) => void;
}

const initialTables: Table[] = Array.from({ length: 15 }, (_, i) => {
    let section = 'Outdoor';
    if (i < 5) {
        section = 'Indoor(Counter)';
    } else if (i < 10) {
        section = 'Indoor(TV)';
    }
    return {
        id: `T${i + 1}`,
        name: `Table ${i + 1}`,
        section: section,
    };
});

export const useTableStore = create(
  persist<TableState>(
    (set) => ({
      tables: initialTables,
      hydrated: false,
      addTable: (name, section) =>
        set((state) => {
          const newId = `T${Date.now()}`;
          const newTable: Table = { id: newId, name, section };
          return { tables: [...state.tables, newTable] };
        }),
      deleteTable: (id) =>
        set((state) => ({
          tables: state.tables.filter((table) => table.id !== id),
        })),
      updateTable: (id, newName, newSection) =>
        set((state) => ({
          tables: state.tables.map((table) =>
            table.id === id ? { ...table, name: newName, section: newSection } : table
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
