'use client';
import { useState } from 'react';
import { initialOrders } from '@/lib/data';
import type { Order } from '@/lib/types';
import OrderCard from '@/components/OrderCard';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function POSView() {
  const [orders, setOrders] = useState<Order[]>(initialOrders.filter(o => o.status !== 'Paid'));
  const { toast } = useToast();

  const handlePrintKOT = (order: Order) => {
    toast({
      title: 'Printing KOT...',
      description: `Sending KOT for Order #${order.id} to the kitchen printer.`,
    });
  };

  const handlePrintBill = (order: Order) => {
    toast({
      title: 'Printing Bill...',
      description: `Printing bill for Table #${order.tableNumber}. Total: ₹${order.total.toFixed(2)}`,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <AnimatePresence>
        {orders
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
