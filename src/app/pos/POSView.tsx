'use client';
import { useState, useMemo } from 'react';
import { useOrderStore, useHydratedStore } from '@/lib/orders-store';
import { useTableStore } from '@/lib/tables-store';
import type { Order, Table } from '@/lib/types';
import OrderCard from '@/components/OrderCard';
import { Button } from '@/components/ui/button';
import { Printer, Clock, Plus, Trash2, Pen, Check, LayoutGrid, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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
import { groupBy } from 'lodash';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TableManagement = () => {
    const tables = useHydratedStore(useTableStore, (state) => state.tables, []);
    const addTable = useTableStore((state) => state.addTable);
    const deleteTable = useTableStore((state) => state.deleteTable);
    const updateTable = useTableStore((state) => state.updateTable);

    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setEditDialogOpen] = useState(false);
    
    const [tableName, setTableName] = useState('');
    
    const [tableToEdit, setTableToEdit] = useState<Table | null>(null);

    const sortedTables = useMemo(() => [...tables].sort((a,b) => a.name.localeCompare(b.name)), [tables]);


    const handleAddTable = () => {
        if (tableName.trim()) {
            addTable(tableName.trim());
            setTableName('');
            setAddDialogOpen(false);
        }
    };

    const handleUpdateTable = () => {
        if (tableToEdit && tableName.trim()) {
            updateTable(tableToEdit.id, tableName.trim());
            setTableName('');
            setEditDialogOpen(false);
            setTableToEdit(null);
        }
    };
    
    const openEditDialog = (table: Table) => {
      setTableToEdit(table);
      setTableName(table.name);
      setEditDialogOpen(true);
    }
    
    const openAddDialog = () => {
        setTableName('');
        setAddDialogOpen(true);
    }


    return (
        <div className="max-w-4xl mx-auto">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Manage Tables</CardTitle>
                    <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={openAddDialog}>
                                <Plus className="mr-2 h-4 w-4" /> Add Table
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Add New Table</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">Name</Label>
                                    <Input id="name" value={tableName} onChange={(e) => setTableName(e.target.value)} className="col-span-3" autoFocus />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" onClick={handleAddTable}>Save Table</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {sortedTables.map(table => (
                            <Card key={table.id} className="flex flex-col h-28 transition-all duration-300 rounded-lg border-2 shadow-sm">
                              <CardHeader className="p-2 pb-0">
                                <CardTitle className="text-sm font-semibold">{table.name}</CardTitle>
                              </CardHeader>
                              <CardContent className="flex flex-col justify-end flex-1 p-2 text-xs text-muted-foreground" />
                              <CardFooter className="p-2 border-t flex gap-2">
                                  <Button variant="outline" size="icon" className="h-8 w-8 flex-1" onClick={() => openEditDialog(table)}>
                                    <Pen className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="destructive" size="icon" className="h-8 w-8 flex-1">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>This will permanently delete '{table.name}'. This action cannot be undone.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => deleteTable(table.id)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                              </CardFooter>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>
            
             <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Table</DialogTitle>
                        <DialogDescription>Update the details for this table.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                       <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-name" className="text-right">Name</Label>
                            <Input id="edit-name" value={tableName} onChange={(e) => setTableName(e.target.value)} className="col-span-3" autoFocus />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" onClick={handleUpdateTable}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

const getTableStatus = (order: Order | undefined) => {
    if (!order) return 'Vacant';
    if (order.status === 'Billed') return 'Billed';
    if (order.items.some(i => i.kotStatus === 'Printed')) return 'KOT Printed';
    if (order.status === 'Confirmed' || order.status === 'New') return 'Running';
    return 'Vacant';
}

const tableStatusStyles: Record<string, { bg: string, text: string, border: string }> = {
    'Vacant': { bg: 'bg-card', text: 'text-card-foreground', border: 'border-border border-dashed' },
    'Running': { bg: 'bg-[var(--table-running)]', text: 'text-blue-800', border: 'border-blue-300' },
    'KOT Printed': { bg: 'bg-[var(--table-kot)]', text: 'text-green-800', border: 'border-green-300' },
    'Billed': { bg: 'bg-[var(--table-billed)]', text: 'text-yellow-800', border: 'border-yellow-400' },
}

const TableGridView = () => {
  const allOrders = useHydratedStore(useOrderStore, (state) => state.orders, []);
  const tables = useHydratedStore(useTableStore, (state) => state.tables, []);
  
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  const ordersByTable = useMemo(() => allOrders.reduce((acc, order) => {
    const table = tables.find(t => t.id === order.tableId);
    if (table && order.status !== 'Paid' && order.status !== 'Cancelled') {
      acc[table.id] = order;
    }
    return acc;
  }, {} as Record<string, Order>), [allOrders, tables]);
  
  const sortedTables = useMemo(() => [...tables].sort((a, b) => a.name.localeCompare(b.name)), [tables]);

  const selectedOrder = selectedTableId ? ordersByTable[selectedTableId] : null;
  const selectedTable = selectedTableId ? tables.find(t => t.id === selectedTableId) : null;
  
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);
  const updateOrderItemsKotStatus = useOrderStore((state) => state.updateOrderItemsKotStatus);

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
    // Bill can only be generated if there are items sent to the kitchen and ALL of them are served.
    if (kitchenItems.length === 0) return false;
    
    return kitchenItems.every(item => item.itemStatus === 'Served');
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        <AnimatePresence>
          {sortedTables.map((table) => {
              const order = ordersByTable[table.id];
              const status = getTableStatus(order);
              const styles = tableStatusStyles[status];
              
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
                      "flex flex-col h-28 transition-all duration-300 rounded-lg border-2",
                      styles.bg,
                      styles.border,
                      order ? 'cursor-pointer hover:shadow-lg' : 'shadow-sm'
                    )}
                  >
                    <CardHeader className="p-2 pb-0">
                      <CardTitle className={cn("text-sm font-semibold", styles.text)}>{table.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col justify-end flex-1 p-2 text-xs">
                      {order ? (
                         <div className={cn("font-bold", styles.text)}>
                          <p className="text-base">₹{order.total.toFixed(0)}</p>
                          <div className="flex items-center gap-1 mt-1">
                            {status === 'Running' && <Clock className="h-3 w-3"/>}
                            {status === 'KOT Printed' && <Printer className="h-3 w-3"/>}
                            {status === 'Billed' && <Check className="h-4 w-4"/>}
                            <span className="text-xs">
                               {Math.round((Date.now() - order.timestamp) / 60000)} min
                            </span>
                          </div>
                         </div>
                      ) : (
                        <p className={cn("text-xs font-semibold", styles.text)}>Vacant</p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )
          })}
         </AnimatePresence>
      </div>
      <Sheet open={!!selectedOrder} onOpenChange={(isOpen) => !isOpen && setSelectedTableId(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
           {selectedOrder && selectedTable && (
             <>
              <SheetHeader>
                <SheetTitle>Details for {selectedTable.name}</SheetTitle>
              </SheetHeader>
               <div className="py-4">
                  <OrderCard order={selectedOrder} tableName={selectedTable.name}>
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
                      {canGenerateBill(selectedOrder) && selectedOrder.status !== 'Billed' && (
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


export default function POSView({
  isSidebarOpen,
  setSidebarOpen,
}: {
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}) {
  const isHydrated = useHydratedStore(useOrderStore, (state) => state.hydrated, false);
  const [activeView, setActiveView] = useState('orders');

  if (!isHydrated) {
    return (
      <main className="flex-1 p-6">
         <Skeleton className="h-12 w-48 mb-6" />
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {[...Array(15)].map((_, j) => (
                  <Skeleton key={j} className="h-28 w-full" />
                ))}
            </div>
          </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-theme(height.16))]">
      <Sheet open={isSidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-60 p-0 pt-8">
            <div className="flex h-full flex-col gap-4 py-4">
                <div className="grid items-start gap-2 px-4">
                    <h2 className="text-lg font-semibold">Navigation</h2>
                </div>
                <nav className="grid gap-2 px-4">
                    <Button
                        variant={activeView === 'orders' ? 'secondary' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => {
                          setActiveView('orders');
                          setSidebarOpen(false);
                        }}
                    >
                        <LayoutGrid className="h-5 w-5" />
                        <span className="ml-4">Active Orders</span>
                    </Button>

                    <Button
                        variant={activeView === 'management' ? 'secondary' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => {
                          setActiveView('management');
                          setSidebarOpen(false);
                        }}
                    >
                        <Settings className="h-5 w-5" />
                        <span className="ml-4">Table Management</span>
                    </Button>
                </nav>
            </div>
        </SheetContent>
      </Sheet>

      <main className="flex-1 p-6">
        {activeView === 'orders' ? <TableGridView /> : <TableManagement />}
      </main>
    </div>
  );
}
