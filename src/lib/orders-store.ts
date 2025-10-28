'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Order, OrderStatus, OrderItem, ItemStatus, OrderType, OnlinePlatform, CustomerDetails, DiscountType, PaymentMethod } from './types';
import { useState, useEffect } from 'react';
import { useMenuStore } from './menu-store';
import { useTableStore } from './tables-store';
import { useSettingsStore } from './settings-store';
import { useSessionStore } from './session-store';

interface OrderState {
  orders: Order[];
  hydrated: boolean;
  addOrder: (order: Omit<Order, 'id' | 'total' | 'timestamp' | 'status' | 'orderType' | 'items'> & { items: Omit<OrderItem, 'kotStatus' | 'itemStatus' | 'kotId'>[] }) => void;
  addOnlineOrder: (order: Omit<Order, 'id' | 'total' | 'timestamp' | 'status' | 'orderType' | 'items'> & { items: Omit<OrderItem, 'kotStatus' | 'itemStatus' | 'kotId'>[] }) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateOrderItemStatus: (orderId: string, kotId: string, newStatus: ItemStatus) => void;
  updateOrderItemsStatus: (orderId: string, currentItemStatus: ItemStatus, newItemStatus: ItemStatus) => void;
  addItemsToOrder: (orderId: string, items: Omit<OrderItem, 'kotStatus' | 'itemStatus' | 'kotId'>[]) => void;
  updateOrderItemsKotStatus: (orderId: string, itemIds: string[]) => void;
  updateItemQuantity: (orderId: string, menuItemId: string, quantity: number) => void;
  removeItem: (orderId: string, menuItemId: string) => void;
  switchTable: (orderId: string, newTableId: string) => boolean;
  clearSwitchedFrom: (orderId: string) => void;
  applyDiscount: (orderId: string, value: number, type: DiscountType) => void;
  setPaymentMethod: (orderId: string, method: PaymentMethod | null) => void;
  requestBill: (orderId: string) => void;
  clearBillRequest: (orderId: string) => void;
  clearOrders: () => void;
  setHydrated: (hydrated: boolean) => void;
}

let orderCounter = 0;

const recalculateTotal = (items: OrderItem[]): number => {
  return items.reduce((acc, item) => acc + item.menuItem.price * item.quantity, 0);
};

const updateOverallOrderStatus = (order: Order): Order => {
  // Do not change status for these terminal/manual states or for online orders.
  if (order.orderType === 'online' || ['Billed', 'Paid', 'Cancelled', 'Delivered'].includes(order.status)) {
    return order;
  }

  const itemsInKitchen = order.items.filter(item => item.kotStatus === 'Printed');
  
  // If no items have been sent to the kitchen yet, it remains as it was (New or Confirmed)
  if (itemsInKitchen.length === 0) {
      return order;
  }

  // If every KOT item is served, the order status returns to 'Confirmed' to keep it on the captain screen
  const allServed = itemsInKitchen.every(item => item.itemStatus === 'Served');
  if (allServed) {
    return { ...order, status: 'Confirmed' };
  }

  // If any item is Ready, the order status is Ready. This is the highest priority status pre-billing.
  const someReady = itemsInKitchen.some(item => item.itemStatus === 'Ready');
  if (someReady) {
    return { ...order, status: 'Ready' };
  }
  
  // If any item is Preparing, the order status is Preparing.
  const somePreparing = itemsInKitchen.some(item => item.itemStatus === 'Preparing');
  if (somePreparing) {
    return { ...order, status: 'Preparing' };
  }
  
  // If we're here, it means items are printed but all are 'Pending'. Status should be 'Confirmed'.
  if(order.status === 'New' || order.status === 'Confirmed') {
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
        const { sessionId } = useSessionStore.getState();
        const latestId = get().orders.reduce((maxId, o) => {
          const idNum = parseInt(o.id.replace('ORD', ''), 10);
          return idNum > maxId ? idNum : maxId;
        }, 0);
        orderCounter = latestId + 1;
        
        let kotCounter = 0;
        const itemsWithStatus: OrderItem[] = order.items.flatMap(i => {
          const items: OrderItem[] = [];
          for (let qty = 0; qty < i.quantity; qty++) {
            items.push({ 
              ...i, 
              quantity: 1, 
              itemStatus: 'Pending', 
              kotStatus: 'New', 
              kotId: `temp-${Date.now()}-${i.menuItem.id}-${qty}` // a temporary unique id
            });
          }
          return items;
        });

        const newOrder: Order = {
          ...order,
          orderType: 'dine-in',
          id: `ORD${String(orderCounter).padStart(3, '0')}`,
          items: itemsWithStatus,
          status: 'New',
          timestamp: Date.now(),
          total: recalculateTotal(itemsWithStatus),
          kotCounter: kotCounter,
          sessionId,
        };
        set((state) => ({ orders: [...state.orders, newOrder] }));
      },
       addOnlineOrder: (order) => {
        const latestId = get().orders.reduce((maxId, o) => {
          const idNum = parseInt(o.id.replace('ORD', ''), 10);
          return idNum > maxId ? idNum : maxId;
        }, 0);
        orderCounter = latestId + 1;
        
        const itemsWithStatus: OrderItem[] = order.items.map(i => ({...i, itemStatus: 'Pending', kotStatus: 'New', kotId: `temp-online-${Date.now()}-${i.menuItem.id}`}));

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
                    kotId: `KOT-${(order.kotCounter || 0) + 1}-${item.menuItem.id}`
                }));
                return { ...order, status, items: updatedItems, kotCounter: (order.kotCounter || 0) + 1 };
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

                const itemsWithStatus: OrderItem[] = newItems.flatMap(item => {
                    const items: OrderItem[] = [];
                    for (let qty = 0; qty < item.quantity; qty++) {
                      items.push({ 
                        ...item, 
                        quantity: 1, 
                        itemStatus: 'Pending', 
                        kotStatus: 'New',
                        kotId: `temp-${Date.now()}-${item.menuItem.id}-${qty}`
                      });
                    }
                    return items;
                });

                updatedItems.push(...itemsWithStatus);
                
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
              let newKotCounter = (order.kotCounter || 0);

              const updatedItems = order.items.map((item) => {
                // We now check against the temporary unique KOT ID assigned to new items
                if (itemIds.includes(item.kotId!) && item.kotStatus === 'New') {
                  newKotCounter++;
                  return { 
                    ...item, 
                    kotStatus: 'Printed' as const, 
                    itemStatus: 'Pending' as const,
                    kotId: `KOT-${newKotCounter}`,
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
      updateOrderItemStatus: (orderId, kotId, newStatus) => {
         set((state) => ({
          orders: state.orders.map((order) => {
            if (order.id === orderId) {
                const itemIndexToUpdate = order.items.findIndex(item => 
                    item.kotId === kotId
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

                const newItems = order.items.filter(item => item.menuItem.id === menuItemId && item.kotStatus === 'New');
                const diff = quantity - newItems.length;

                let updatedItems = [...order.items];

                if (diff > 0) { // Add items
                    const itemToAdd = order.items.find(item => item.menuItem.id === menuItemId);
                    if (itemToAdd) {
                        for (let i = 0; i < diff; i++) {
                            updatedItems.push({
                                ...itemToAdd,
                                quantity: 1,
                                kotStatus: 'New',
                                itemStatus: 'Pending',
                                kotId: `temp-${Date.now()}-${menuItemId}-${i}`
                            });
                        }
                    }
                } else if (diff < 0) { // Remove items
                    const itemsToRemove = Math.abs(diff);
                    let removedCount = 0;
                    updatedItems = updatedItems.filter(item => {
                        if (item.menuItem.id === menuItemId && item.kotStatus === 'New' && removedCount < itemsToRemove) {
                            removedCount++;
                            return false;
                        }
                        return true;
                    });
                }
                
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
      applyDiscount: (orderId, value, type) => {
        set(state => ({
            orders: state.orders.map(order => {
                if (order.id !== orderId) return order;

                const originalTotal = order.originalTotal || recalculateTotal(order.items);
                let discountAmount = 0;

                if (type === 'percentage') {
                    discountAmount = (originalTotal * value) / 100;
                } else {
                    discountAmount = value;
                }

                const newTotal = originalTotal - discountAmount;

                return {
                    ...order,
                    total: newTotal > 0 ? newTotal : 0,
                    originalTotal: originalTotal,
                    discount: value,
                    discountType: type,
                }
            })
        }))
      },
      setPaymentMethod: (orderId, method) => {
        set(state => ({
          orders: state.orders.map(order => 
            order.id === orderId ? { ...order, paymentMethod: method } : order
          )
        }))
      },
      requestBill: (orderId) => {
        set(state => ({
          orders: state.orders.map(order =>
            order.id === orderId ? { ...order, billRequested: true } : order
          )
        }))
      },
      clearBillRequest: (orderId) => {
        set(state => ({
          orders: state.orders.map(order =>
            order.id === orderId ? { ...order, billRequested: false } : order
          )
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
      },
      // A custom replacer is needed to handle the transformation from grouped items to individual items
      replacer: (key, value) => {
        if (key === 'orders') {
          // This is a simple way to check if we're dealing with the old structure.
          // A more robust check might be needed for complex migrations.
          const isOldStructure = value.some((order: Order) => order.items.some(item => item.quantity > 1 && item.kotStatus === 'New'));
          
          if (isOldStructure) {
            return value.map((order: Order) => ({
              ...order,
              items: order.items.flatMap((item: OrderItem) => {
                if (item.quantity > 1) {
                  const items: OrderItem[] = [];
                  for (let i = 0; i < item.quantity; i++) {
                    items.push({
                      ...item,
                      quantity: 1,
                      kotId: item.kotId ? `${item.kotId}-${i}` : `temp-migrated-${Date.now()}-${item.menuItem.id}-${i}`
                    });
                  }
                  return items;
                }
                return { ...item, kotId: item.kotId || `temp-migrated-${Date.now()}-${item.menuItem.id}` };
              })
            }));
          }
        }
        return value;
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
      if (e.key && ['order-storage', 'table-storage', 'menu-storage', 'settings-storage', 'session-storage'].includes(e.key)) {
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
