'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Order, OrderStatus, OrderItem, ItemStatus, OrderType, OnlinePlatform, CustomerDetails } from './types';
import { useState, useEffect } from 'react';
import { useMenuStore } from './menu-store';
import { useTableStore } from './tables-store';
import { useSettingsStore } from './settings-store';

interface OrderState {
  orders: Order[];
  hydrated: boolean;
  addOrder: (order: Omit<Order, 'id' | 'total' | 'timestamp' | 'status' | 'tableNumber' | 'orderType'>) => void;
  addOnlineOrder: (order: Omit<Order, 'id' | 'total' | 'timestamp' | 'status' | 'orderType'>) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateOrderItemStatus: (orderId: string, menuItemId: string, newStatus: ItemStatus) => void;
  updateOrderItemsStatus: (orderId: string, currentItemStatus: ItemStatus, newItemStatus: ItemStatus) => void;
  addItemsToOrder: (orderId: string, items: Omit<OrderItem, 'kotStatus' | 'itemStatus'>[]) => void;
  updateOrderItemsKotStatus: (orderId: string, itemIds: string[]) => void;
  updateItemQuantity: (orderId: string, menuItemId: string, quantity: number) => void;
  removeItem: (orderId: string, menuItemId: string) => void;
  switchTable: (orderId: string, newTableId: string) => boolean;
  clearSwitchedFrom: (orderId: string) => void;
  clearOrders: () => void;
  setHydrated: (hydrated: boolean) => void;
}

let orderCounter = 0;

const recalculateTotal = (items: OrderItem[]): number => {
  return items.reduce((acc, item) => acc + item.menuItem.price * item.quantity, 0);
};

const updateOverallOrderStatus = (order: Order): Order => {
  if (order.orderType === 'online' || ['Billed', 'Paid', 'Cancelled', 'Delivered', 'New', 'Accepted', 'Food Ready', 'Out for Delivery'].includes(order.status)) {
    return order;
  }

  const itemsInKitchen = order.items.filter(item => item.kotStatus === 'Printed');
  
  if (itemsInKitchen.length === 0) {
      if (order.status !== 'New') return { ...order, status: 'Confirmed' };
      return order;
  }

  const allServed = itemsInKitchen.every(item => item.itemStatus === 'Served');
  if (allServed) {
    return { ...order, status: 'Served' };
  }

  const someReady = itemsInKitchen.some(item => item.itemStatus === 'Ready');
  if (someReady) {
    return { ...order, status: 'Ready' };
  }

  const somePreparing = itemsInKitchen.some(item => item.itemStatus === 'Preparing');
  if (somePreparing) {
    return { ...order, status: 'Preparing' };
  }

  if (order.status !== 'New') {
     return { ...order, status: 'Confirmed' };
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
        
        const itemsWithStatus: OrderItem[] = order.items.map(i => ({...i, itemStatus: 'Pending', kotStatus: 'New'}));

        const newOrder: Order = {
          ...order,
          orderType: 'dine-in',
          id: `ORD${String(orderCounter).padStart(3, '0')}`,
          items: itemsWithStatus,
          status: 'New',
          timestamp: Date.now(),
          total: recalculateTotal(itemsWithStatus),
          kotCounter: 0,
        };
        set((state) => ({ orders: [...state.orders, newOrder] }));
      },
       addOnlineOrder: (order) => {
        const latestId = get().orders.reduce((maxId, o) => {
          const idNum = parseInt(o.id.replace('ORD', ''), 10);
          return idNum > maxId ? idNum : maxId;
        }, 0);
        orderCounter = latestId + 1;
        
        const itemsWithStatus: OrderItem[] = order.items.map(i => ({...i, itemStatus: 'Pending', kotStatus: 'New'}));

        const newOrder: Order = {
          ...order,
          orderType: 'online',
          id: `ORD${String(orderCounter).padStart(3, '0')}`,
          items: itemsWithStatus,
          status: 'New', // Online orders start as 'New' until accepted
          timestamp: Date.now(),
          total: recalculateTotal(itemsWithStatus),
          kotCounter: 0,
        };
        set((state) => ({ orders: [...state.orders, newOrder] }));
      },
      updateOrderStatus: (orderId, status) =>
        set((state) => ({
          orders: state.orders.map((order) => {
            if (order.id !== orderId) return order;
            // For online orders, when they are marked as ready, we move them to 'Food Ready'
            if(order.orderType === 'online' && status === 'Ready') {
              return { ...order, status: 'Food Ready' };
            }
             // For online orders, when they are accepted, all items are marked as pending for the kitchen
            if (order.orderType === 'online' && status === 'Accepted') {
                 const updatedItems = order.items.map(item => ({
                    ...item,
                    itemStatus: 'Pending' as const,
                    kotStatus: 'Printed' as const,
                }));
                return { ...order, status, items: updatedItems };
            }
            return { ...order, status };
          }),
        })),
       addItemsToOrder: (orderId, newItems) =>
        set((state) => {
          return {
            orders: state.orders.map((order) => {
              if (order.id === orderId) {
                const updatedItems = [...order.items];

                const itemsWithStatus: OrderItem[] = newItems.map(item => ({...item, itemStatus: 'Pending', kotStatus: 'New'}));

                itemsWithStatus.forEach((newItem) => {
                    const existingItemIndex = updatedItems.findIndex(
                        (i) => i.menuItem.id === newItem.menuItem.id && i.kotStatus === 'New'
                    );
                    
                    if (existingItemIndex > -1) {
                         updatedItems[existingItemIndex].quantity += newItem.quantity;
                    } else {
                        updatedItems.push(newItem);
                    }
                });
                
                 const newStatus: OrderStatus = ['Billed', 'Paid', 'Cancelled'].includes(order.status) ? order.status : 'New';

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
              const newKotCounter = (order.kotCounter || 0) + 1;
              const newKotId = `KOT-${newKotCounter}`;

              const updatedItems = order.items.map((item) => {
                if (itemIds.includes(item.menuItem.id) && item.kotStatus === 'New') {
                  return { 
                    ...item, 
                    kotStatus: 'Printed' as const, 
                    itemStatus: 'Pending' as const,
                    kotId: newKotId,
                  };
                }
                return item;
              });
              
              const newStatus: OrderStatus = order.orderType === 'online' ? order.status : 'Confirmed';

              const updatedOrder = { 
                ...order, 
                items: updatedItems,
                kotCounter: newKotCounter,
                status: newStatus,
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

                  let updatedOrder = { ...order, items: updatedItems };
                  
                  if(order.orderType === 'online') {
                    const allItemsReady = updatedItems.every(i => i.itemStatus === 'Ready' || i.itemStatus === 'Served');
                    if (allItemsReady && updatedOrder.status !== 'Food Ready') {
                      updatedOrder.status = 'Food Ready';
                    }
                  } else {
                     updatedOrder = updateOverallOrderStatus(updatedOrder);
                  }

                  return updatedOrder;
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
              let updatedOrder = { ...order, items: updatedItems };

              if(order.orderType === 'online') {
                  const allItemsReady = updatedItems.every(i => i.itemStatus === 'Ready' || i.itemStatus === 'Served');
                  if (allItemsReady && updatedOrder.status !== 'Food Ready') {
                    updatedOrder.status = 'Food Ready';
                  }
              } else {
                  updatedOrder = updateOverallOrderStatus(updatedOrder);
              }

              return updatedOrder;
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
      switchTable: (orderId, newTableId) => {
        const orders = get().orders;
        const targetTableIsOccupied = orders.some(o => o.tableId === newTableId && o.status !== 'Paid' && o.status !== 'Cancelled');
        
        if (targetTableIsOccupied) {
          console.error("Target table is already occupied.");
          return false;
        }

        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId ? { ...order, switchedFrom: order.tableId, tableId: newTableId } : order
          ),
        }));
        return true;
      },
      clearSwitchedFrom: (orderId) => {
        set((state) => ({
          orders: state.orders.map((order) => {
            if (order.id === orderId && order.switchedFrom) {
              const { switchedFrom, ...rest } = order;
              return rest;
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

const stores = [useOrderStore, useMenuStore, useTableStore, useSettingsStore];

export function useHydratedStore<T, F>(
  store: (callback: (state: T) => unknown) => unknown,
  selector: (state: T) => F,
  defaultState: F
) {
  const result = store(selector) as F;
  const [data, setData] = useState(defaultState);

  useEffect(() => {
    // This effect runs whenever the result from the store changes
    setData(result);
  }, [result]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // If a storage event happens for any of our stores, rehydrate all of them.
      if (e.key && ['order-storage', 'table-storage', 'menu-storage', 'settings-storage'].includes(e.key)) {
        stores.forEach(s => s.persist.rehydrate());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Hydration check
  const hydrated = (store as any).getState().hydrated;
  useEffect(() => {
    if (hydrated) {
      setData(result);
    }
  }, [hydrated, result]);

  return data;
}
