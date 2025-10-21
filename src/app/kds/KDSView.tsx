'use client';
import { useMemo } from 'react';
import { useOrderStore, useHydratedStore } from '@/lib/orders-store';
import type { OrderItem, ItemStatus, Order, OrderStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
  items: (OrderItem & {originalOrderId: string})[];
}

export default function KDSView() {
  const allOrders = useHydratedStore(useOrderStore, (state) => state.orders, []);
  const updateOrderItemStatus = useOrderStore((state) => state.updateOrderItemStatus);
  const isHydrated = useHydratedStore(useOrderStore, (state) => state.hydrated, false);

  const kdsOrders = useMemo((): GroupedOrder[] => {
    const activeKitchenItemsByTable = allOrders.reduce((acc, order) => {
      // Only consider orders that are not yet Paid or Cancelled
      if (['Paid', 'Cancelled'].includes(order.status)) {
        return acc;
      }
      
      const kitchenItems = order.items.filter(
        item => item.kotStatus === 'Printed'
      );

      if (kitchenItems.length > 0) {
        if (!acc[order.tableNumber]) {
          acc[order.tableNumber] = {
            orderId: order.id,
            tableNumber: order.tableNumber,
            orderTimestamp: order.timestamp,
            items: []
          };
        }
        
        // Use the latest timestamp for the card
        if(order.timestamp > acc[order.tableNumber].orderTimestamp){
            acc[order.tableNumber].orderTimestamp = order.timestamp;
        }

        // Add items with their original orderId for status updates
        const itemsWithOrderId = kitchenItems.map(item => ({...item, originalOrderId: order.id}));

        acc[order.tableNumber].items.push(...itemsWithOrderId);
      }
      
      return acc;
    }, {} as Record<number, GroupedOrder>);

    // Combine all items for a table from different orders into one view
     const combinedOrders = Object.values(activeKitchenItemsByTable).map(tableOrder => {
        // Flatten all items from different orders for the same table
        const allTableItems = allOrders
            .filter(o => o.tableNumber === tableOrder.tableNumber && !['Paid', 'Cancelled'].includes(o.status))
            .flatMap(o => 
                o.items
                 .filter(item => item.kotStatus === 'Printed')
                 .map(item => ({ ...item, originalOrderId: o.id }))
            );
        
        // Deduplicate items based on original order ID and menu item ID
        const uniqueItems = allTableItems.reduce((acc, current) => {
            const x = acc.find(item => item.originalOrderId === current.originalOrderId && item.menuItem.id === current.menuItem.id);
            if (!x) {
                return acc.concat([current]);
            } else {
                return acc;
            }
        }, [] as (OrderItem & {originalOrderId: string})[]);

        return {
            ...tableOrder,
            items: uniqueItems,
        };
     });

    return combinedOrders.sort((a,b) => a.orderTimestamp - b.orderTimestamp);

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
              key={order.tableNumber}
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
                <CardContent>
                    <div className="text-sm">
                      {/* Header */}
                      <div className="flex items-center font-semibold text-muted-foreground border-b pb-2">
                          <div className="flex-1">Item</div>
                          <div className="w-12 text-center">Qty</div>
                          <div className="w-28 text-center">Status</div>
                          <div className="w-32 text-right">Action</div>
                      </div>
                      {/* Items */}
                      <ul className="divide-y">
                        {order.items
                        .sort((a, b) => a.menuItem.name.localeCompare(b.menuItem.name))
                        .map((item) => (
                          <li key={`${item.originalOrderId}-${item.menuItem.id}`} className="flex items-center py-3">
                            <div className="flex-1 font-medium">{item.menuItem.name}</div>
                            <div className="w-12 text-center font-bold">{item.quantity}</div>
                            <div className="w-28 flex justify-center">
                              <ItemStatusBadge status={item.itemStatus} />
                            </div>
                            <div className="w-32 text-right">
                              {itemStatusActions[item.itemStatus] && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleAction(item.originalOrderId, item.menuItem.id, item.itemStatus)}
                                    className="w-full"
                                  >
                                    {itemStatusActions[item.itemStatus]?.label}
                                  </Button>
                                )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
       </AnimatePresence>
    </div>
  );
}
