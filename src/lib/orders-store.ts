'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Order, OrderStatus, OrderItem, MenuItem } from './types';

interface OrderState {
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  addItemsToOrder: (orderId: string, items: OrderItem[]) => void;
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
       addItemsToOrder: (orderId, newItems) =>
        set((state) => {
          return {
            orders: state.orders.map((order) => {
              if (order.id === orderId) {
                const updatedItems = [...order.items];
                let newTotal = order.total;

                newItems.forEach((newItem) => {
                    const existingItemIndex = updatedItems.findIndex(
                        (i) => i.menuItem.id === newItem.menuItem.id
                    );
                    if (existingItemIndex > -1) {
                        updatedItems[existingItemIndex].quantity += newItem.quantity;
                    } else {
                        updatedItems.push(newItem);
                    }
                    newTotal += newItem.menuItem.price * newItem.quantity;
                });
                
                return { 
                  ...order, 
                  items: updatedItems,
                  total: newTotal,
                  // If adding items to a confirmed order, it should be reflected in KDS
                  status: order.status === 'Served' ? 'Confirmed' : order.status,
                  timestamp: Date.now() 
                };
              }
              return order;
            }),
          };
        }),
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
  const result = useOrderStore(selector);
  const isHydrated = useOrderStore((state) => state._rehydrated);
  return isHydrated ? result : defaultValue;
};
