'use client';
import { useMemo } from 'react';
import { useOrderStore, useHydratedStore } from '@/lib/orders-store';
import type { OrderItem, ItemStatus, Order } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { AnimatePresence, motion } from 'framer-motion';


type KitchenItem = OrderItem & {
  orderId: string;
  tableNumber: number;
  orderTimestamp: number;
};

const itemStatusActions: Record<ItemStatus, { next: ItemStatus; label: string } | null> = {
  'Pending': { next: 'Preparing', label: 'Start Preparing' },
  'Preparing': { next: 'Ready', label: 'Mark as Ready' },
  'Ready': null,
};

const ItemStatusBadge = ({ status }: { status: ItemStatus }) => {
  const colors: Record<ItemStatus, string> = {
    'Pending': 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300 dark:border-cyan-800/60',
    'Preparing': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-800/60',
    'Ready': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800/60',
  }
  return <Badge className={colors[status]}>{status}</Badge>
}

type GroupedOrder = {
  orderId: string;
  tableNumber: number;
  orderTimestamp: number;
  items: KitchenItem[];
}

export default function KDSView() {
  const allOrders = useHydratedStore(useOrderStore, (state) => state.orders, []);
  const updateOrderItemStatus = useOrderStore((state) => state.updateOrderItemStatus);
  const isHydrated = useHydratedStore(useOrderStore, (state) => state.hydrated, false);

  const kdsOrders = useMemo((): GroupedOrder[] => {
    const kitchenItems = allOrders
      .filter(o => !['Paid', 'Cancelled', 'New'].includes(o.status))
      .flatMap(order => 
        order.items
          .filter(item => item.kotStatus === 'Printed')
          .map(item => ({
            ...item,
            orderId: order.id,
            tableNumber: order.tableNumber,
            orderTimestamp: order.timestamp,
          }))
      );
    
    const grouped = kitchenItems.reduce((acc, item) => {
      if (!acc[item.orderId]) {
        acc[item.orderId] = {
          orderId: item.orderId,
          tableNumber: item.tableNumber,
          orderTimestamp: item.orderTimestamp,
          items: []
        };
      }
      acc[item.orderId].items.push(item);
      return acc;
    }, {} as Record<string, GroupedOrder>);

    return Object.values(grouped).sort((a,b) => a.orderTimestamp - b.orderTimestamp);

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
                  <CardTitle className="flex justify-between items-center">
                    <span>Table {order.tableNumber}</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {formatDistanceToNow(new Date(order.orderTimestamp), { addSuffix: true })}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 -mt-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-center w-[50px]">Qty</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.items.map((item) => (
                        <TableRow key={item.menuItem.id}>
                          <TableCell>{item.menuItem.name}</TableCell>
                          <TableCell className="text-center font-bold">{item.quantity}</TableCell>
                          <TableCell><ItemStatusBadge status={item.itemStatus} /></TableCell>
                          <TableCell className="text-right">
                             {itemStatusActions[item.itemStatus] && (
                                <Button
                                  size="sm"
                                  onClick={() => handleAction(item.orderId, item.menuItem.id, item.itemStatus)}
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
