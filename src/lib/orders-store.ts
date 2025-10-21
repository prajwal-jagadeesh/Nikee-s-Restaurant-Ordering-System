'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Order, OrderStatus, OrderItem, ItemStatus } from './types';
import { useState, useEffect } from 'react';

interface OrderState {
  orders: Order[];
  hydrated: boolean;
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateOrderItemStatus: (orderId: string, menuItemId: string, newStatus: ItemStatus) => void;
  addItemsToOrder: (orderId: string, items: OrderItem[]) => void;
  updateOrderItemsKotStatus: (orderId: string, itemIds: string[]) => void;
  clearOrders: () => void;
  setHydrated: (hydrated: boolean) => void;
}

let orderCounter = 0;

const updateOverallOrderStatus = (order: Order): Order => {
  const allItemsReady = order.items.every(item => item.itemStatus === 'Ready');
  const anyItemPreparing = order.items.some(item => item.itemStatus === 'Preparing');
  const allItemsPending = order.items.every(item => item.itemStatus === 'Pending');

  if (order.status === 'Billed' || order.status === 'Served' || order.status === 'Cancelled' || order.status === 'Paid') {
    // Don't automatically change these statuses
    return order;
  }
  
  if (allItemsReady) {
    return { ...order, status: 'Ready' };
  }
  if (anyItemPreparing) {
    return { ...order, status: 'Preparing' };
  }
  if (allItemsPending && order.status !== 'Confirmed') {
     const hasPrintedItems = order.items.some(i => i.kotStatus === 'Printed');
     if(hasPrintedItems) return { ...order, status: 'KOT Printed' };
  }
  return order;
};

export const useOrderStore = create(
  persist<OrderState>(
    (set, get) => ({
      orders: [],
      hydrated: false,
      addOrder: (order) => {
        const latestId = get().orders.reduce((maxId, o) => {
          const idNum = parseInt(o.id.replace('ORD', ''), 10);
          return idNum > maxId ? idNum : maxId;
        }, 0);
        orderCounter = latestId + 1;
        
        const newOrder: Order = {
          ...order,
          id: `ORD${String(orderCounter).padStart(3, '0')}`,
          items: order.items.map(i => ({...i, itemStatus: 'Pending'})),
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

                const itemsWithStatus = newItems.map(item => ({...item, itemStatus: 'Pending' as const}))

                itemsWithStatus.forEach((newItem) => {
                    const existingItemIndex = updatedItems.findIndex(
                        (i) => i.menuItem.id === newItem.menuItem.id && i.kotStatus === 'New'
                    );
                    if (existingItemIndex > -1) {
                         updatedItems[existingItemIndex].quantity += newItem.quantity;
                    } else {
                        updatedItems.push(newItem);
                    }
                    newTotal += newItem.menuItem.price * newItem.quantity;
                });
                
                // When adding new items, reset status to 'New' to force re-confirmation
                // only if it's in a final state like Paid or Cancelled.
                const shouldResetStatus = ['Paid', 'Cancelled', 'Billed', 'Served'].includes(order.status);
                
                return { 
                  ...order, 
                  items: updatedItems,
                  total: newTotal,
                  status: shouldResetStatus ? 'New' : order.status,
                  timestamp: Date.now() 
                };
              }
              return order;
            }),
          };
        }),
      updateOrderItemsKotStatus: (orderId, itemIds) => {
        set((state) => ({
          orders: state.orders.map((order) => {
            if (order.id === orderId) {
              const updatedItems = order.items.map((item) => {
                if (itemIds.includes(item.menuItem.id) && item.kotStatus === 'New') {
                  return { ...item, kotStatus: 'Printed' as const };
                }
                return item;
              });
              
              const hasNewItems = updatedItems.some(i => i.kotStatus === 'New');

              let newStatus = order.status;
              // If the order was just confirmed and now has KOT items, move it to KOT Printed.
              // Don't change the status if there are still other new items that need confirming.
              if (order.status === 'Confirmed' && !hasNewItems) {
                newStatus = 'KOT Printed';
              }
              
              return { 
                ...order, 
                items: updatedItems,
                status: newStatus,
              };
            }
            return order;
          }),
        }));
      },
      updateOrderItemStatus: (orderId, menuItemId, newStatus) => {
         set((state) => ({
          orders: state.orders.map((order) => {
            if (order.id === orderId) {
                const updatedItems = order.items.map(item => 
                    item.menuItem.id === menuItemId && item.itemStatus !== 'Ready'
                    ? { ...item, itemStatus: newStatus }
                    : item
                );
                const updatedOrder = { ...order, items: updatedItems };
                
                // After updating an item, recalculate the overall order status
                return updateOverallOrderStatus(updatedOrder);
            }
            return order;
          }),
        }));
      },
      clearOrders: () => {
        set({ orders: [] });
        orderCounter = 0;
      },
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: 'order-storage', 
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true);
        }
      }
    }
  )
);


/**
 * A hook that provides a Zustand store that is safe to use with SSR and hydration.
 * It also includes a listener for storage events to enable real-time updates across tabs.
 * @param selector The selector function to pick data from the store
 * @param defaultState The default state to use before hydration
 * @returns The selected state from the store, or the default state if not hydrated yet.
 */
export function useHydratedStore<T, F>(
  store: (callback: (state: T) => unknown) => unknown,
  selector: (state: T) => F,
  defaultState: F
) {
  const result = store(selector) as F;
  const [data, setData] = useState(defaultState);
  const hydrated = useOrderStore((state) => state.hydrated);

  useEffect(() => {
    if (hydrated) {
      setData(result);
    }
  }, [hydrated, result]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'order-storage') {
        useOrderStore.persist.rehydrate();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return data;
}
