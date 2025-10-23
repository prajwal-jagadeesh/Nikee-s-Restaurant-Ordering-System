'use client';
import { useMemo } from 'react';
import { useOrderStore, useHydratedStore } from '@/lib/orders-store';
import { useTableStore } from '@/lib/tables-store';
import type { OrderItem, ItemStatus, Order } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import ItemStatusBadge from '@/components/ItemStatusBadge';
import { Utensils, Truck } from 'lucide-react';

const itemStatusActions: Record<ItemStatus, { next: ItemStatus; label: string } | null> = {
  'Pending': { next: 'Preparing', label: 'Start Preparing' },
  'Preparing': { next: 'Ready', label: 'Mark as Ready' },
  'Ready': null,
  'Served': null,
};

type GroupedOrder = {
  orderId: string;
  orderType: 'dine-in' | 'online';
  tableId?: string;
  tableName?: string;
  platform?: string;
  platformOrderId?: string;
  orderTimestamp: number;
  items: (OrderItem & { originalOrderId: string })[];
}

export default function KDSView() {
  const allOrders = useHydratedStore(useOrderStore, (state) => state.orders, []);
  const tables = useHydratedStore(useTableStore, (state) => state.tables, []);
  const tableMap = useMemo(() => new Map(tables.map(t => [t.id, t.name])), [tables]);
  
  const updateOrderItemStatus = useOrderStore((state) => state.updateOrderItemStatus);
  const isHydrated = useHydratedStore(useOrderStore, (state) => state.hydrated, false);

  const kdsOrders = useMemo((): GroupedOrder[] => {
    const activeKitchenOrders = allOrders.filter(order => {
        // KDS should show orders that are Confirmed, Preparing, Ready, or Billed.
        const relevantStatuses = ['Confirmed', 'Preparing', 'Ready', 'Billed'];
        return relevantStatuses.includes(order.status);
    });

    const combinedOrders = activeKitchenOrders.map(order => {
        const kitchenItems = order.items
            // For dine-in, we still respect the KOT status. For online, all items are sent to kitchen at once.
            .filter(item => (order.orderType === 'online' || item.kotStatus === 'Printed'))
            .map(item => ({ ...item, originalOrderId: order.id }));
        
        return {
            orderId: order.id,
            orderType: order.orderType,
            tableId: order.tableId,
            tableName: order.tableId ? tableMap.get(order.tableId) : undefined,
            platform: order.onlinePlatform,
            platformOrderId: order.platformOrderId,
            orderTimestamp: order.timestamp,
            items: kitchenItems,
        };
    });

    return combinedOrders.filter(o => o.items.length > 0).sort((a,b) => a.orderTimestamp - b.orderTimestamp);

  }, [allOrders, tableMap]);

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
                    <div className="flex items-center gap-3">
                        {order.orderType === 'dine-in' ? <Utensils /> : <Truck />}
                        <div>
                            <CardTitle>{order.orderType === 'dine-in' ? order.tableName : `${order.platform} #${order.platformOrderId}`}</CardTitle>
                            <span className="text-xs font-normal text-muted-foreground -mt-1">
                                {formatDistanceToNow(new Date(order.orderTimestamp), { addSuffix: true })}
                            </span>
                        </div>
                    </div>
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
                          <li key={`${item.originalOrderId}-${item.menuItem.id}-${item.kotId}`} className="flex items-center py-3">
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
