'use client';
import { create } from 'zustand';
import type { Order, OrderStatus } from './types';

interface OrderState {
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  clearOrders: () => void;
}

let orderCounter = 0;

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  addOrder: (order) => {
    orderCounter += 1;
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
  }
}));
