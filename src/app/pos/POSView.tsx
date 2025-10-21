'use client';
import { useState, useMemo } from 'react';
import { useOrderStore, useHydratedStore } from '@/lib/orders-store';
import { useTableStore } from '@/lib/tables-store';
import type { Order } from '@/lib/types';
import OrderCard from '@/components/OrderCard';
import { Button } from '@/components/ui/button';
import { Printer, Clock, Plus, Trash2, Pen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const TableManagement = () => {
    const tables = useHydratedStore(useTableStore, (state) => state.tables, []);
    const addTable = useTableStore((state) => state.addTable);
    const deleteTable = useTableStore((state) => state.deleteTable);
    const updateTableName = useTableStore((state) => state.updateTableName);

    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [isRenameDialogOpen, setRenameDialogOpen] = useState(false);
    const [newTableName, setNewTableName] = useState('');
    const [tableToRename, setTableToRename] = useState<{ id: string, name: string } | null>(null);

    const handleAddTable = () => {
        if (newTableName.trim()) {
            addTable(newTableName.trim());
            setNewTableName('');
            setAddDialogOpen(false);
        }
    };

    const handleRenameTable = () => {
        if (tableToRename && newTableName.trim()) {
            updateTableName(tableToRename.id, newTableName.trim());
            setNewTableName('');
            setRenameDialogOpen(false);
            setTableToRename(null);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Manage Tables</CardTitle>
                    <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Add Table
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Add New Table</DialogTitle>
                                <DialogDescription>
                                    Enter a name for the new table.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">
                                        Name
                                    </Label>
                                    <Input
                                        id="name"
                                        value={newTableName}
                                        onChange={(e) => setNewTableName(e.target.value)}
                                        className="col-span-3"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" onClick={handleAddTable}>Save Table</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <ul className="divide-y">
                        {tables.map(table => (
                            <li key={table.id} className="flex items-center justify-between py-3">
                                <span className="font-medium">{table.name}</span>
                                <div className="flex items-center gap-2">
                                    <Dialog open={isRenameDialogOpen && tableToRename?.id === table.id} onOpenChange={(isOpen) => {
                                        if (!isOpen) {
                                            setRenameDialogOpen(false);
                                            setTableToRename(null);
                                        }
                                    }}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="icon" onClick={() => {
                                                setTableToRename(table);
                                                setNewTableName(table.name);
                                                setRenameDialogOpen(true);
                                            }}>
                                                <Pen className="h-4 w-4" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[425px]">
                                            <DialogHeader>
                                                <DialogTitle>Rename Table</DialogTitle>
                                                <DialogDescription>
                                                    Enter a new name for '{table.name}'.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label htmlFor="rename" className="text-right">
                                                        Name
                                                    </Label>
                                                    <Input
                                                        id="rename"
                                                        value={newTableName}
                                                        onChange={(e) => setNewTableName(e.target.value)}
                                                        className="col-span-3"
                                                        autoFocus
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button type="submit" onClick={handleRenameTable}>Save Changes</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="icon">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete '{table.name}'. This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => deleteTable(table.id)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
};

export default function POSView() {
  const allOrders = useHydratedStore(useOrderStore, (state) => state.orders, []);
  const tables = useHydratedStore(useTableStore, (state) => state.tables, []);
  
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);
  const updateOrderItemsKotStatus = useOrderStore((state) => state.updateOrderItemsKotStatus);
  const isHydrated = useHydratedStore(useOrderStore, (state) => state.hydrated, false);

  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  const ordersByTable = allOrders.reduce((acc, order) => {
    // Find table by number first for legacy orders, then by name
    const table = tables.find(t => t.id === order.tableId);
    if (table && order.status !== 'Paid' && order.status !== 'Cancelled') {
      acc[table.id] = order;
    }
    return acc;
  }, {} as Record<string, Order>);
  
  const selectedOrder = selectedTableId ? ordersByTable[selectedTableId] : null;
  const selectedTable = selectedTableId ? tables.find(t => t.id === selectedTableId) : null;

  const handlePrintKOT = (order: Order) => {
    const newItems = order.items.filter(item => item.kotStatus === 'New');
    if (newItems.length === 0) return;
    
    const newItemIds = newItems.map(item => item.menuItem.id);
    updateOrderItemsKotStatus(order.id, newItemIds);
  };

  const handlePrintBill = (order: Order) => {
    updateOrderStatus(order.id, 'Billed');
  };
  
  const needsKotPrint = (order: Order) => {
    return order.status === 'Confirmed' && order.items.some(item => item.kotStatus === 'New');
  }

  const canGenerateBill = (order: Order) => {
    const kitchenItems = order.items.filter(item => item.kotStatus === 'Printed');
    if (kitchenItems.length === 0 && order.items.some(i => i.kotStatus === 'New')) return false;
    if (kitchenItems.length === 0 && order.items.length > 0) return true;
    return kitchenItems.every(item => item.itemStatus === 'Served');
  }

  if (!isHydrated) {
    const totalTables = useTableStore.getState().tables.length || 15;
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(totalTables)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <Tabs defaultValue="orders">
      <TabsList className="mb-4">
        <TabsTrigger value="orders">Active Orders</TabsTrigger>
        <TabsTrigger value="management">Table Management</TabsTrigger>
      </TabsList>

      <TabsContent value="orders">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <AnimatePresence>
            {tables.map((table) => {
                const order = ordersByTable[table.id];
                return (
                  <motion.div
                    key={table.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  >
                    <Card
                      onClick={() => order && setSelectedTableId(table.id)}
                      className={cn(
                        "flex flex-col h-32 transition-all duration-300",
                        order 
                          ? 'bg-primary/10 border-primary cursor-pointer hover:shadow-lg hover:border-primary/50'
                          : 'bg-card'
                      )}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{table.name}</CardTitle>
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
      </TabsContent>

      <TabsContent value="management">
        <TableManagement />
      </TabsContent>
      
      <Sheet open={!!selectedOrder} onOpenChange={(isOpen) => !isOpen && setSelectedTableId(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
           {selectedOrder && selectedTable && (
             <>
              <SheetHeader>
                <SheetTitle>Details for {selectedTable.name}</SheetTitle>
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
    </Tabs>
  );
}
