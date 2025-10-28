'use client';
import { useState, useMemo } from 'react';
import { useOrderStore, useHydratedStore } from '@/lib/orders-store';
import { useTableStore } from '@/lib/tables-store';
import type { Order, OrderItem, Table } from '@/lib/types';
import OrderCard from '@/components/OrderCard';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription
} from '@/components/ui/sheet';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Helper to group items for display
const groupItems = (items: OrderItem[]) => {
    const grouped = new Map<string, OrderItem>();
    items.forEach(item => {
        const existing = grouped.get(item.menuItem.id);
        if (existing) {
            existing.quantity += 1;
        } else {
            grouped.set(item.menuItem.id, { ...item, quantity: 1 });
        }
    });
    return Array.from(grouped.values());
};

const naturalSort = (a: Table, b: Table) => {
    const numA = parseInt(a.name.match(/\d+/)?.[0] || '0', 10);
    const numB = parseInt(b.name.match(/\d+/)?.[0] || '0', 10);
    return numA - numB;
};

export default function CaptainView() {
  const allOrders = useHydratedStore(useOrderStore, (state) => state.orders, []);
  const tables = useHydratedStore(useTableStore, (state) => state.tables, []);
  
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);
  const updateOrderItemStatus = useOrderStore((state) => state.updateOrderItemStatus);
  const updateItemQuantity = useOrderStore((state) => state.updateItemQuantity);
  const removeItem = useOrderStore((state) => state.removeItem);
  const switchTable = useOrderStore((state) => state.switchTable);
  
  const isHydrated = useHydratedStore(useOrderStore, (state) => state.hydrated, false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [switchingOrder, setSwitchingOrder] = useState<Order | null>(null);

  const orders = allOrders.filter(o => o.status !== 'Paid' && o.status !== 'Cancelled');
  
  const handleMarkServed = (orderId: string, kotId: string) => {
    updateOrderItemStatus(orderId, kotId, 'Served');
  };
  
  const handlePayment = (orderId: string) => {
    updateOrderStatus(orderId, 'Paid');
  };

  const handleCancel = (orderId: string) => {
    updateOrderStatus(orderId, 'Cancelled');
  };

  const handleConfirmOrder = (orderId: string) => {
    updateOrderStatus(orderId, 'Confirmed');
  };

  const canCancelOrder = (order: Order) => {
    return !order.items.some(item => item.kotStatus === 'Printed');
  };

  const hasNewItems = (order: Order) => {
    return order.items.some(item => item.kotStatus === 'New');
  };
  
  const editingOrder = orders.find(o => o.id === editingOrderId);
  
  const tableMap = useMemo(() => new Map(tables.map(t => [t.id, t.name])), [tables]);
  const sortedTables = useMemo(() => [...tables].sort(naturalSort), [tables]);


  const occupiedTableIds = useMemo(() => {
    const occupiedIds = new Set<string>();
    orders.forEach(order => {
        // The order being switched is not considered "occupied" for the purpose of finding a new table
        if (switchingOrder && order.id === switchingOrder.id) return;
        occupiedIds.add(order.tableId!);
    });
    return occupiedIds;
  }, [orders, switchingOrder]);

  const vacantTables = useMemo(() => {
    return sortedTables.filter(t => !occupiedTableIds.has(t.id));
  }, [sortedTables, occupiedTableIds]);

  const handleSwitchTable = (newTableId: string) => {
    if (switchingOrder) {
      const success = switchTable(switchingOrder.id, newTableId);
      if (success) {
        setSwitchingOrder(null);
      } else {
        alert('Could not switch table. The selected table might be occupied.');
      }
    }
  };


  const newItemsForEditing = editingOrder ? groupItems(editingOrder.items.filter(i => i.kotStatus === 'New')) : [];
  const newItemsTotal = newItemsForEditing?.reduce((acc, item) => acc + item.menuItem.price * item.quantity, 0) || 0;


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
    <>
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
                <OrderCard 
                  order={order} 
                  tableName={tableMap.get(order.tableId!)} 
                  onServeItem={handleMarkServed} 
                  showKotDetails={false}
                  onSwitchTable={() => setSwitchingOrder(order)}
                  onEditItems={hasNewItems(order) ? () => setEditingOrderId(order.id) : undefined}
                  onCancelOrder={canCancelOrder(order) ? () => handleCancel(order.id) : undefined}
                >
                  <div className="mt-4 flex flex-col space-y-2">
                    {hasNewItems(order) && order.status === 'New' && (
                       <Button onClick={() => handleConfirmOrder(order.id)} className="w-full">
                         Confirm Order
                      </Button>
                    )}
                    
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

      <Sheet open={!!editingOrder} onOpenChange={(isOpen) => !isOpen && setEditingOrderId(null)}>
        <SheetContent className="flex flex-col">
          <SheetHeader>
            <SheetTitle>Edit New Items</SheetTitle>
            <SheetDescription>
              Adjust quantities or remove items before sending to the kitchen.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto -mx-6 px-6 divide-y">
            {newItemsForEditing && newItemsForEditing.length > 0 ? (
                <div className="py-4">
                  <div className="space-y-4">
                    {newItemsForEditing.map((item) => (
                      <div key={item.menuItem.id} className="flex items-center gap-4">
                        <div className="flex-1">
                          <p className="font-semibold">{item.menuItem.name}</p>
                          <p className="text-sm text-muted-foreground">₹{item.menuItem.price.toFixed(2)}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateItemQuantity(editingOrder!.id, item.menuItem.id, item.quantity - 1)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span>{item.quantity}</span>
                             <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateItemQuantity(editingOrder!.id, item.menuItem.id, item.quantity + 1)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-right">
                            <p className="font-semibold">₹{(item.menuItem.price * item.quantity).toFixed(2)}</p>
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => removeItem(editingOrder!.id, item.menuItem.id)}>
                               <Trash2 className="h-4 w-4"/>
                            </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
            ) : (
               <p className="text-muted-foreground text-center pt-8">No new items to edit.</p>
            )}
          </div>
           {editingOrder && (
            <SheetFooter className="border-t pt-4 mt-auto bg-background">
                <div className="w-full space-y-4">
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                        <span>New Items Total</span>
                        <span>₹{newItemsTotal.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between font-bold text-xl">
                      <span>Grand Total</span>
                      <span>₹{editingOrder.total.toFixed(2)}</span>
                    </div>
                    <Button size="lg" className="w-full" onClick={() => setEditingOrderId(null)}>
                      Done
                    </Button>
                </div>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={!!switchingOrder} onOpenChange={(isOpen) => !isOpen && setSwitchingOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch from {switchingOrder ? tableMap.get(switchingOrder.tableId!) : ''}</DialogTitle>
            <DialogDescription>
              Select a vacant table to move this order to.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
            {vacantTables.length > 0 ? (
                vacantTables.map(table => (
                <Button
                  key={table.id}
                  variant="outline"
                  onClick={() => handleSwitchTable(table.id)}
                >
                  {table.name}
                </Button>
              ))
            ) : (
              <p className="col-span-full text-center text-muted-foreground">No vacant tables available.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
