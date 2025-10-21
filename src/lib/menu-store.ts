'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { menuItems, menuCategories } from './data';
import type { MenuItem } from './types';

interface MenuState {
  menuItems: MenuItem[];
  menuCategories: string[];
  hydrated: boolean;
  addMenuItem: (item: Omit<MenuItem, 'id' | 'available'>) => void;
  updateMenuItem: (item: MenuItem) => void;
  deleteMenuItem: (id: string) => void;
  toggleMenuItemAvailability: (id: string) => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useMenuStore = create(
  persist<MenuState>(
    (set, get) => ({
      menuItems: menuItems,
      menuCategories: menuCategories,
      hydrated: false,
      addMenuItem: (item) =>
        set((state) => {
          const newId = `M${Date.now()}`;
          const newItem: MenuItem = { ...item, id: newId, available: true };
          const menuItems = [...state.menuItems, newItem];
          const menuCategories = [...new Set(menuItems.map(i => i.category))];
          return { menuItems, menuCategories };
        }),
      updateMenuItem: (item) =>
        set((state) => {
           const menuItems = state.menuItems.map((i) => (i.id === item.id ? item : i));
           const menuCategories = [...new Set(menuItems.map(i => i.category))];
           return { menuItems, menuCategories };
        }),
      deleteMenuItem: (id) =>
        set((state) => ({
          menuItems: state.menuItems.filter((item) => item.id !== id),
        })),
      toggleMenuItemAvailability: (id) =>
        set((state) => ({
          menuItems: state.menuItems.map((item) =>
            item.id === id ? { ...item, available: !item.available } : item
          ),
        })),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: 'menu-storage',
      storage: createJSONStorage(() => localStorage),
       onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true);
        }
      }
    }
  )
);
