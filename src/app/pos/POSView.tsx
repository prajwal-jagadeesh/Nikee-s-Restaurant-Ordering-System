'use client';
import { useState } from 'react';
import { useOrderStore, useHydratedStore } from '@/lib/orders-store';
import type { Order } from '@/lib/types';
import OrderCard from '@/components/OrderCard';
import { Button } from '@/components/ui/button';
import { Printer, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const TOTAL_TABLES = 15;

export default function POSView() {
  const allOrders = useHydratedStore(useOrderStore, (state) => state.orders, []);
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);
  const updateOrderItemsKotStatus = useOrderStore((state) => state.updateOrderItemsKotStatus);
  const isHydrated = useHydratedStore(useOrderStore, (state) => state.hydrated, false);

  const [selectedTable, setSelectedTable] = useState<number | null>(null);

  const ordersByTable = allOrders.reduce((acc, order) => {
    if (order.status !== 'Paid' && order.status !== 'Cancelled') {
      acc[order.tableNumber] = order;
    }
    return acc;
  }, {} as Record<number, Order>);
  
  const selectedOrder = selectedTable ? ordersByTable[selectedTable] : null;

  const handlePrintKOT = (order: Order) => {
    const newItems = order.items.filter(item => item.kotStatus === 'New');
    if (newItems.length === 0) return;
    
    const newItemIds = newItems.map(item => item.menuItem.id);
    updateOrderItemsKotStatus(order.id, newItemIds);
  };

  const handlePrintBill = (order: Order) => {
    console.log(`Printing bill for Table #${order.tableNumber}. Total: ₹${order.total.toFixed(2)}`);
    updateOrderStatus(order.id, 'Billed');
  };
  
  const needsKotPrint = (order: Order) => {
    // KOT can be printed only if the order is confirmed and there are new items.
    return order.status === 'Confirmed' && order.items.some(item => item.kotStatus === 'New');
  }

  const canGenerateBill = (order: Order) => {
    // Bill can be generated if the order is Served, Ready, or if all items have been served.
    if (order.status === 'Served' || order.status === 'Ready') {
      return true;
    }
    // This catches the case where all items are served but the overall status hasn't updated yet.
    return order.items.every(item => item.itemStatus === 'Served');
  }

  if (!isHydrated) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(TOTAL_TABLES)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <AnimatePresence>
        {Array.from({ length: TOTAL_TABLES }, (_, i) => i + 1).map((tableNumber) => {
            const order = ordersByTable[tableNumber];
            return (
              <motion.div
                key={tableNumber}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              >
                <Card
                  onClick={() => order && setSelectedTable(tableNumber)}
                  className={cn(
                    "flex flex-col h-32 transition-all duration-300",
                    order 
                      ? 'bg-primary/10 border-primary cursor-pointer hover:shadow-lg hover:border-primary/50'
                      : 'bg-card'
                  )}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Table {tableNumber}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col justify-end flex-1 text-sm">
                    {order ? (
                       <>
                        <p className="font-bold text-lg">₹{order.total.toFixed(2)}</p>
                        <div className="flex items-center text-muted-foreground text-xs">
                          <Clock className="h-3 w-3 mr-1"/>
                          {formatDistanceToNow(new Date(order.timestamp), { addSuffix: true })}
                        </div>
                       </>
                    ) : (
                      <p className="text-muted-foreground">Vacant</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
        })}
       </AnimatePresence>
    </div>
     <Sheet open={!!selectedOrder} onOpenChange={(isOpen) => !isOpen && setSelectedTable(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
           {selectedOrder && (
             <>
              <SheetHeader>
                <SheetTitle>Details for Table {selectedOrder.tableNumber}</SheetTitle>
              </SheetHeader>
               <div className="py-4">
                  <OrderCard order={selectedOrder}>
                    <div className="mt-4 flex flex-col space-y-2">
                      {needsKotPrint(selectedOrder) && (
                        <Button
                          variant="outline"
                          onClick={() => handlePrintKOT(selectedOrder)}
                          className="w-full"
                        >
                          <Printer className="mr-2 h-4 w-4" />
                          Print KOT
                        </Button>
                      )}
                      {canGenerateBill(selectedOrder) && (
                        <Button onClick={() => handlePrintBill(selectedOrder)} className="w-full">
                          <Printer className="mr-2 h-4 w-4" />
                          Generate & Print Bill
                        </Button>
                      )}
                    </div>
                  </OrderCard>
               </div>
             </>
           )}
        </SheetContent>
      </Sheet>
    </>
  );
}
