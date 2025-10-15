'use client';
import { useState, useEffect } from 'react';
import { useOrderStore, useHydratedOrderStore } from '@/lib/orders-store';
import type { Order, OrderStatus } from '@/lib/types';
import OrderCard from '@/components/OrderCard';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function CaptainView() {
  const allOrders = useHydratedOrderStore((state) => state.orders, []);
  const updateOrderStatusInStore = useOrderStore((state) => state.updateOrderStatus);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const { toast } = useToast();
  const isHydrated = useHydratedOrderStore((state) => state._rehydrated, false);

  useEffect(() => {
    setOrders(allOrders.filter(o => o.status !== 'Paid'));
  }, [allOrders]);

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatusInStore(orderId, newStatus);
  };
  
  const handleConfirm = (orderId: string) => {
    updateOrderStatus(orderId, 'Confirmed');
    toast({ title: "Order Confirmed", description: `${orderId} sent to KDS.` });
  };
  
  const handleServed = (orderId: string) => {
    updateOrderStatus(orderId, 'Served');
    toast({ title: "Order Served", description: `Food for ${orderId} has been served.` });
  };
  
  const handlePayment = (orderId: string) => {
    updateOrderStatus(orderId, 'Paid');
    toast({ title: "Payment Received", description: `Payment for ${orderId} complete. Table cleared.` });
  };

  if (!isHydrated) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <AnimatePresence>
        {orders
          .filter(o => o.status !== 'Paid' && o.status !== 'Cancelled')
          .sort((a,b) => a.timestamp - b.timestamp)
          .map((order) => (
            <motion.div
              key={order.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            >
              <OrderCard order={order}>
                <div className="mt-4 flex flex-col space-y-2">
                  {order.status === 'New' && (
                    <Button onClick={() => handleConfirm(order.id)} className="w-full">
                      Confirm Order
                    </Button>
                  )}
                  {order.status === 'Ready' && (
                    <Button onClick={() => handleServed(order.id)} className="w-full">
                      Mark as Served
                    </Button>
                  )}
                  {order.status === 'Served' && (
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
