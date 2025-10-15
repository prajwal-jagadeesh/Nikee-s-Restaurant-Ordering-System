'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Order, OrderStatus } from './types';

interface OrderState {
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  clearOrders: () => void;
  _rehydrated: boolean;
  setRehydrated: () => void;
}

let orderCounter = 0;

export const useOrderStore = create(
  persist<OrderState>(
    (set, get) => ({
      orders: [],
      addOrder: (order) => {
        // This is a simplistic way to generate IDs. In a real app, use UUIDs or database IDs.
        const latestId = get().orders.reduce((maxId, o) => {
          const idNum = parseInt(o.id.replace('ORD', ''), 10);
          return idNum > maxId ? idNum : maxId;
        }, 0);
        orderCounter = latestId + 1;
        
        const newOrder: Order = {
          ...order,
          id: `ORD${String(orderCounter).padStart(3, '0')}`,
        };
        set((state) => ({ orders: [...state.orders, newOrder] }));
      },
      updateOrderStatus: (orderId, status) =>
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId ? { ...order, status } : order
          ),
        })),
      clearOrders: () => {
        set({ orders: [] });
        orderCounter = 0;
      },
      _rehydrated: false,
      setRehydrated: () => set({ _rehydrated: true }),
    }),
    {
      name: 'order-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
      onRehydrateStorage: () => (state) => {
        if (state) state.setRehydrated();
      },
    }
  )
);

// Selector to use in components to ensure they only render after rehydration
export const useHydratedOrderStore = <T>(
  selector: (state: OrderState) => T,
  defaultValue: T
): T => {
  const isHydrated = useOrderStore((state) => state._rehydrated);
  const result = useOrderStore(selector);
  return isHydrated ? result : defaultValue;
};
