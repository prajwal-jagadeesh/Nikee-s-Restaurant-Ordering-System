'use client';
import { useState, useEffect } from 'react';
import { useOrderStore, useHydratedStore } from '@/lib/orders-store';
import type { Order } from '@/lib/types';
import OrderCard from '@/components/OrderCard';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

export default function POSView() {
  const allOrders = useHydratedStore(useOrderStore, (state) => state.orders, []);
  const [orders, setOrders] = useState<Order[]>([]);
  const isHydrated = allOrders.length > 0 || useHydratedStore(useOrderStore, (state) => !!state.orders, false);


  useEffect(() => {
    setOrders(allOrders.filter(o => o.status !== 'Paid' && o.status !== 'Cancelled'));
  }, [allOrders]);

  const handlePrintKOT = (order: Order) => {
    console.log(`Printing KOT for Order #${order.id}`);
  };

  const handlePrintBill = (order: Order) => {
    console.log(`Printing bill for Table #${order.tableNumber}. Total: ₹${order.total.toFixed(2)}`);
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
          .sort((a, b) => a.timestamp - b.timestamp)
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
                  {order.status === 'Confirmed' && (
                    <Button
                      variant="outline"
                      onClick={() => handlePrintKOT(order)}
                      className="w-full"
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Print KOT
                    </Button>
                  )}
                  {order.status === 'Served' && (
                    <Button onClick={() => handlePrintBill(order)} className="w-full">
                      <Printer className="mr-2 h-4 w-4" />
                      Print Bill
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
