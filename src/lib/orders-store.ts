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
  updateOrderItemsStatus: (orderId: string, currentItemStatus: ItemStatus, newItemStatus: ItemStatus) => void;
  addItemsToOrder: (orderId: string, items: OrderItem[]) => void;
  updateOrderItemsKotStatus: (orderId: string, itemIds: string[]) => void;
  clearOrders: () => void;
  setHydrated: (hydrated: boolean) => void;
}

let orderCounter = 0;

const updateOverallOrderStatus = (order: Order): Order => {
  const allItemsServed = order.items.every(item => item.itemStatus === 'Served');
  const anyItemPreparing = order.items.some(item => item.itemStatus === 'Preparing');
  const allItemsReadyOrServed = order.items.every(item => ['Ready', 'Served'].includes(item.itemStatus));


  // Don't automatically change from these statuses
  if (['Billed', 'Paid', 'Cancelled', 'New', 'Confirmed'].includes(order.status)) {
    return order;
  }
  
  if (allItemsServed) {
    return { ...order, status: 'Served' };
  }
   if (allItemsReadyOrServed) {
    if (order.items.some(item => item.itemStatus === 'Ready')) {
        return { ...order, status: 'Ready' };
    }
  }
  if (anyItemPreparing) {
    return { ...order, status: 'Preparing' };
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
          orders: state.orders.map((order) => {
            if (order.id !== orderId) return order;

            let updatedOrder = { ...order, status };

            // If an order is being cancelled, all its pending items are cancelled too
            if (status === 'Cancelled') {
              updatedOrder.items = updatedOrder.items.map(item => 
                item.itemStatus === 'Pending' ? { ...item, itemStatus: 'Served' } : item // A bit of a hack to hide from KDS
              );
            }
            
            return updatedOrder;
          }),
        })),
       addItemsToOrder: (orderId, newItems) =>
        set((state) => {
          return {
            orders: state.orders.map((order) => {
              if (order.id === orderId) {
                const updatedItems = [...order.items];
                let newTotal = order.total;

                const itemsWithStatus = newItems.map(item => ({...item, itemStatus: 'Pending' as const, kotStatus: 'New' as const}))

                itemsWithStatus.forEach((newItem) => {
                    const existingItemIndex = updatedItems.findIndex(
                        (i) => i.menuItem.id === newItem.menuItem.id && i.itemStatus === 'Pending' && i.kotStatus === 'New'
                    );
                    
                    if (existingItemIndex > -1) {
                         updatedItems[existingItemIndex].quantity += newItem.quantity;
                    } else {
                        updatedItems.push(newItem);
                    }
                    newTotal += newItem.menuItem.price * newItem.quantity;
                });
                
                let newStatus: OrderStatus = order.status;
                if (order.status === 'Paid' || order.status === 'Cancelled' || order.status === 'Served' || order.status === 'Billed' || order.status === 'Ready' || order.status === 'Preparing') {
                  newStatus = 'Confirmed';
                }

                return { 
                  ...order, 
                  items: updatedItems,
                  total: newTotal,
                  status: newStatus,
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

              let newStatus: OrderStatus = order.status;
              if (order.status === 'Confirmed') {
                  newStatus = 'Preparing'; 
              }
              
              const updatedOrder = { 
                ...order, 
                items: updatedItems,
                status: newStatus
              };

              return updateOverallOrderStatus(updatedOrder);
            }
            return order;
          }),
        }));
      },
      updateOrderItemStatus: (orderId, menuItemId, newStatus) => {
         set((state) => ({
          orders: state.orders.map((order) => {
            if (order.id === orderId) {
                const itemIndexToUpdate = order.items.findIndex(item => 
                    item.menuItem.id === menuItemId && item.itemStatus !== 'Served'
                );

                if (itemIndexToUpdate > -1) {
                  const updatedItems = [...order.items];
                  updatedItems[itemIndexToUpdate] = {
                    ...updatedItems[itemIndexToUpdate],
                    itemStatus: newStatus
                  };

                  const updatedOrder = { ...order, items: updatedItems };
                  return updateOverallOrderStatus(updatedOrder);
                }

                return order;
            }
            return order;
          }),
        }));
      },
      updateOrderItemsStatus: (orderId, currentItemStatus, newItemStatus) => {
        set((state) => ({
          orders: state.orders.map((order) => {
            if (order.id === orderId) {
              const updatedItems = order.items.map(item =>
                item.itemStatus === currentItemStatus
                  ? { ...item, itemStatus: newItemStatus }
                  : item
              );
              const updatedOrder = { ...order, items: updatedItems };
              return updateOverallOrderStatus(updatedOrder);
            }
            return order;
          })
        }))
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
