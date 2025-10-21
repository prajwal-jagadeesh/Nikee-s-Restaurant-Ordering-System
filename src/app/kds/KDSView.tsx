'use client';
import { useMemo } from 'react';
import { useOrderStore, useHydratedStore } from '@/lib/orders-store';
import type { Order, OrderItem, ItemStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import OrderStatusBadge from '@/components/OrderStatusBadge';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

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


export default function KDSView() {
  const allOrders = useHydratedStore(useOrderStore, (state) => state.orders, []);
  const updateOrderItemStatus = useOrderStore((state) => state.updateOrderItemStatus);
  const isHydrated = useHydratedStore(useOrderStore, (state) => state.hydrated, false);

  const kitchenItems = useMemo((): KitchenItem[] => {
    return allOrders
      .filter(o => !['Paid', 'Cancelled', 'New', 'Confirmed'].includes(o.status))
      .flatMap(order => 
        order.items
          .filter(item => item.kotStatus === 'Printed' && item.itemStatus !== 'Ready')
          .map(item => ({
            ...item,
            orderId: order.id,
            tableNumber: order.tableNumber,
            orderTimestamp: order.timestamp,
          }))
      )
      .sort((a, b) => a.orderTimestamp - b.orderTimestamp);
  }, [allOrders]);

  const handleAction = (orderId: string, menuItemId: string, currentStatus: ItemStatus) => {
    const action = itemStatusActions[currentStatus];
    if (action) {
      updateOrderItemStatus(orderId, menuItemId, action.next);
    }
  };

  if (!isHydrated) {
    return (
      <div className="border rounded-lg">
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="border bg-card rounded-lg shadow-sm">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Table</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {kitchenItems.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                            No active items in the kitchen.
                        </TableCell>
                    </TableRow>
                ) : (
                    kitchenItems.map((item) => (
                        <TableRow key={`${item.orderId}-${item.menuItem.id}`}>
                            <TableCell className="font-medium">
                                <div className="font-bold text-lg">{item.tableNumber}</div>
                                <div className="text-xs text-muted-foreground">{item.orderId}</div>
                            </TableCell>
                            <TableCell>{formatDistanceToNow(new Date(item.orderTimestamp), { addSuffix: true })}</TableCell>
                            <TableCell>{item.menuItem.name}</TableCell>
                            <TableCell className="text-center font-bold text-lg">{item.quantity}</TableCell>
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
                    ))
                )}
            </TableBody>
        </Table>
    </div>
  );
}
