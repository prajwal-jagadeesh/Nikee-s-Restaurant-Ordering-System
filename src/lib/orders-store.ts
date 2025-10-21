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
  updateItemQuantity: (orderId: string, menuItemId: string, quantity: number) => void;
  removeItem: (orderId: string, menuItemId: string) => void;
  clearOrders: () => void;
  setHydrated: (hydrated: boolean) => void;
}

let orderCounter = 0;

const recalculateTotal = (items: OrderItem[]): number => {
  return items.reduce((acc, item) => acc + item.menuItem.price * item.quantity, 0);
};

const updateOverallOrderStatus = (order: Order): Order => {
  const someItemsServed = order.items.some(item => item.itemStatus === 'Served');
  const anyItemPreparing = order.items.some(item => item.itemStatus === 'Preparing');
  const anyItemReady = order.items.some(item => item.itemStatus === 'Ready');
  const allItemsServedOrPending = order.items.every(item => ['Served', 'Pending'].includes(item.itemStatus));


  // If status is manually set or terminal, don't auto-update.
  if (['Billed', 'Paid', 'Cancelled', 'New', 'Confirmed'].includes(order.status)) {
    return order;
  }
  
  // If at least one item is served, and nothing is currently being cooked or ready, it's a "Served" state for billing.
  if (someItemsServed && !anyItemPreparing && !anyItemReady) {
    return { ...order, status: 'Served' };
  }

  if (anyItemReady) {
    return { ...order, status: 'Ready' };
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
          status: 'New',
        };
        set((state) => ({ orders: [...state.orders, newOrder] }));
      },
      updateOrderStatus: (orderId, status) =>
        set((state) => ({
          orders: state.orders.map((order) => {
            if (order.id !== orderId) return order;

            let updatedOrder = { ...order, status };
            
            if (status === 'Confirmed') {
                const updatedItems = order.items.map((item) => 
                  item.kotStatus === 'New' ? { ...item, kotStatus: 'Printed' as const } : item
                );
                updatedOrder.items = updatedItems;
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
                        (i) => i.menuItem.id === newItem.menuItem.id && i.kotStatus === 'New' && i.itemStatus === 'Pending'
                    );
                    
                    if (existingItemIndex > -1) {
                         updatedItems[existingItemIndex].quantity += newItem.quantity;
                    } else {
                        updatedItems.push(newItem);
                    }
                });
                
                const newStatus: OrderStatus = order.status === 'Paid' || order.status === 'Cancelled' ? order.status : 'New';

                return { 
                  ...order, 
                  items: updatedItems,
                  total: recalculateTotal(updatedItems),
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
                  return { ...item, kotStatus: 'Printed' as const, itemStatus: 'Pending' as const };
                }
                return item;
              });
              
              const updatedOrder = { 
                ...order, 
                items: updatedItems,
                 status: 'Confirmed' as const,
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
      updateItemQuantity: (orderId, menuItemId, quantity) => {
        set((state) => ({
          orders: state.orders.map((order) => {
            if (order.id !== orderId) return order;

            const updatedItems = order.items
              .map((item) => {
                if (item.menuItem.id === menuItemId && item.kotStatus === 'New') {
                  if (quantity <= 0) return null; // Mark for removal
                  return { ...item, quantity };
                }
                return item;
              })
              .filter(Boolean) as OrderItem[]; // Filter out nulls

            return {
              ...order,
              items: updatedItems,
              total: recalculateTotal(updatedItems),
            };
          }),
        }));
      },
      removeItem: (orderId, menuItemId) => {
        set((state) => ({
          orders: state.orders.map((order) => {
            if (order.id !== orderId) return order;
            
            const updatedItems = order.items.filter(
              (item) => !(item.menuItem.id === menuItemId && item.kotStatus === 'New')
            );
            
            return {
              ...order,
              items: updatedItems,
              total: recalculateTotal(updatedItems),
            };
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
