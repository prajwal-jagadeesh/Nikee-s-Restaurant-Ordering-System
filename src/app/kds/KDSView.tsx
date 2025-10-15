'use client';
import { useState } from 'react';
import { initialOrders } from '@/lib/data';
import type { Order, OrderStatus } from '@/lib/types';
import OrderCard from '@/components/OrderCard';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { AnimatePresence, motion } from 'framer-motion';

const KDS_STATUSES: OrderStatus[] = ['New', 'Preparing', 'Ready'];

const statusActions: Record<OrderStatus, { next: OrderStatus; label: string } | null> = {
  New: { next: 'Preparing', label: 'Start Preparing' },
  Confirmed: null,
  Preparing: { next: 'Ready', label: 'Mark as Ready' },
  Ready: null,
  Served: null,
  Paid: null,
  Cancelled: null,
};

export default function KDSView() {
  const [orders, setOrders] = useState<Order[]>(initialOrders.filter(o => KDS_STATUSES.includes(o.status)));

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
  };
  
  const handleAction = (orderId: string, currentStatus: OrderStatus) => {
    const action = statusActions[currentStatus];
    if (action) {
      updateOrderStatus(orderId, action.next);
    }
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-4">
      {KDS_STATUSES.map((status) => (
        <div key={status} className="flex-1 flex flex-col bg-muted/50 rounded-lg">
          <h2 className="p-4 text-lg font-semibold border-b font-headline">{status} ({orders.filter(o => o.status === status).length})</h2>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              <AnimatePresence>
                {orders
                  .filter((order) => order.status === status)
                  .sort((a,b) => a.timestamp - b.timestamp)
                  .map((order) => (
                    <motion.div
                      key={order.id}
                      layout
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    >
                      <OrderCard order={order}>
                        {statusActions[order.status] && (
                          <Button
                            onClick={() => handleAction(order.id, order.status)}
                            className="w-full mt-4"
                          >
                            {statusActions[order.status]?.label}
                          </Button>
                        )}
                      </OrderCard>
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>
      ))}
    </div>
  );
}
