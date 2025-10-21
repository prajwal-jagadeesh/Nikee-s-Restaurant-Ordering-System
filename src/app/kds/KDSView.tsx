'use client';
import { useMemo } from 'react';
import { useOrderStore, useHydratedStore } from '@/lib/orders-store';
import type { OrderItem, ItemStatus, Order } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import ItemStatusBadge from '@/components/ItemStatusBadge';


const itemStatusActions: Record<ItemStatus, { next: ItemStatus; label: string } | null> = {
  'Pending': { next: 'Preparing', label: 'Start Preparing' },
  'Preparing': { next: 'Ready', label: 'Mark as Ready' },
  'Ready': null,
  'Served': null,
};

type GroupedOrder = {
  orderId: string;
  tableNumber: number;
  orderTimestamp: number;
  items: OrderItem[];
  status: Order['status'];
}

export default function KDSView() {
  const allOrders = useHydratedStore(useOrderStore, (state) => state.orders, []);
  const updateOrderItemStatus = useOrderStore((state) => state.updateOrderItemStatus);
  const isHydrated = useHydratedStore(useOrderStore, (state) => state.hydrated, false);

  const kdsOrders = useMemo((): GroupedOrder[] => {
    const grouped = allOrders
      .filter(o => !['Paid', 'Cancelled', 'New'].includes(o.status))
      .map(order => ({
        orderId: order.id,
        tableNumber: order.tableNumber,
        orderTimestamp: order.timestamp,
        status: order.status,
        items: order.items
          .filter(item => item.kotStatus === 'Printed')
      }))
      .filter(order => order.items.length > 0);

    return grouped.sort((a,b) => a.orderTimestamp - b.orderTimestamp);

  }, [allOrders]);

  const handleAction = (orderId: string, menuItemId: string, currentStatus: ItemStatus) => {
    const action = itemStatusActions[currentStatus];
    if (action) {
      updateOrderItemStatus(orderId, menuItemId, action.next);
    }
  };

  if (!isHydrated) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-[400px] w-full" />
        ))}
      </div>
    );
  }

  return (
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AnimatePresence>
        {kdsOrders.length === 0 ? (
          <div className="col-span-full text-center py-24">
            <p className="text-muted-foreground text-lg">No active items in the kitchen.</p>
          </div>
        ) : (
          kdsOrders.map((order) => (
             <motion.div
              key={order.orderId}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
            >
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle>Table {order.tableNumber}</CardTitle>
                  <span className="text-xs font-normal text-muted-foreground -mt-1">
                      {formatDistanceToNow(new Date(order.orderTimestamp), { addSuffix: true })}
                  </span>
                </CardHeader>
                <CardContent className="flex-1 -mt-4 p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="px-6">Item</TableHead>
                          <TableHead className="w-[50px] text-center px-6">Qty</TableHead>
                          <TableHead className="px-6">Status</TableHead>
                          <TableHead className="text-right px-6">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.items.map((item) => (
                          <TableRow key={item.menuItem.id}>
                            <TableCell className="font-medium px-6">{item.menuItem.name}</TableCell>
                            <TableCell className="text-center font-bold px-6">{item.quantity}</TableCell>
                            <TableCell className="px-6"><ItemStatusBadge status={item.itemStatus} /></TableCell>
                            <TableCell className="text-right px-6">
                              {itemStatusActions[item.itemStatus] && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleAction(order.orderId, item.menuItem.id, item.itemStatus)}
                                  >
                                    {itemStatusActions[item.itemStatus]?.label}
                                  </Button>
                                )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
       </AnimatePresence>
    </div>
  );
}
