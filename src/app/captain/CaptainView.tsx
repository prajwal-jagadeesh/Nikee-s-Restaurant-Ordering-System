'use client';
import { useOrderStore, useHydratedStore } from '@/lib/orders-store';
import type { Order, OrderStatus } from '@/lib/types';
import OrderCard from '@/components/OrderCard';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Printer } from 'lucide-react';

export default function CaptainView() {
  const allOrders = useHydratedStore(useOrderStore, (state) => state.orders, []);
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);
  const updateOrderItemStatus = useOrderStore((state) => state.updateOrderItemStatus);
  const updateOrderItemsKotStatus = useOrderStore((state) => state.updateOrderItemsKotStatus);
  
  const isHydrated = useHydratedStore(useOrderStore, (state) => state.hydrated, false);

  const orders = allOrders.filter(o => o.status !== 'Paid' && o.status !== 'Cancelled');
  
  const handleMarkServed = (orderId: string, menuItemId: string) => {
    updateOrderItemStatus(orderId, menuItemId, 'Served');
  };
  
  const handlePayment = (orderId: string) => {
    updateOrderStatus(orderId, 'Paid');
  };

  const handleCancel = (orderId: string) => {
    updateOrderStatus(orderId, 'Cancelled');
  };

  const handleSendToKitchen = (order: Order) => {
    const newItems = order.items.filter(item => item.kotStatus === 'New');
    if (newItems.length === 0) return;
    
    const newItemIds = newItems.map(item => item.menuItem.id);
    updateOrderItemsKotStatus(order.id, newItemIds);
  };

  const needsKotPrint = (order: Order) => {
    return order.items.some(item => item.kotStatus === 'New');
  }

  if (!isHydrated) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <AnimatePresence>
        {orders
          .sort((a,b) => a.timestamp - b.timestamp)
          .map((order) => (
            <motion.div
              key={order.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            >
              <OrderCard order={order} onServeItem={handleMarkServed}>
                <div className="mt-4 flex flex-col space-y-2">
                  {needsKotPrint(order) && (
                    <Button
                      variant="outline"
                      onClick={() => handleSendToKitchen(order)}
                      className="w-full"
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Send to Kitchen
                    </Button>
                  )}
                  <div className="flex gap-2">
                     <Button onClick={() => handleCancel(order.id)} variant="destructive" className="w-full">
                      Cancel Order
                    </Button>
                  </div>
                  {order.status === 'Billed' && (
                     <Button onClick={() => handlePayment(order.id)} className="w-full">
                      Receive Payment
                    </Button>
                  )}
                </div>
              </OrderCard>
            </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
