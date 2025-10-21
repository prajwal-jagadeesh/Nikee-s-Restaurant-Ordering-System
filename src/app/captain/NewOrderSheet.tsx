'use client';
import { useState, useMemo, useEffect } from 'react';
import { useOrderStore, useHydratedStore } from '@/lib/orders-store';
import { useTableStore } from '@/lib/tables-store';
import { useMenuStore } from '@/lib/menu-store';
import type { MenuItem, OrderItem, Table } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from '@/components/ui/sheet';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { AnimatePresence, motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface NewOrderSheetProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export default function NewOrderSheet({ isOpen, onOpenChange }: NewOrderSheetProps) {
    const allOrders = useHydratedStore(useOrderStore, state => state.orders, []);
    const tables = useHydratedStore(useTableStore, state => state.tables, []);
    const allMenuItems = useHydratedStore(useMenuStore, state => state.menuItems, []);
    const menuCategories = useHydratedStore(useMenuStore, state => state.menuCategories, []);
    const addOrder = useOrderStore(state => state.addOrder);

    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [cart, setCart] = useState<Omit<OrderItem, 'kotStatus' | 'itemStatus'>[]>([]);
    const [activeTab, setActiveTab] = useState(menuCategories[0]);
    
    useEffect(() => {
        if(isOpen) {
            setSelectedTableId(null);
            setCart([]);
            if (menuCategories.length > 0) {
               setActiveTab(menuCategories[0]);
            }
        }
    }, [isOpen, menuCategories]);

    const sortedTables = useMemo(() => [...tables].sort((a,b) => a.name.localeCompare(b.name)), [tables]);
    const menuItems = useMemo(() => allMenuItems.filter(item => item.available), [allMenuItems]);

    const occupiedTableIds = useMemo(() => {
        const occupiedIds = new Set<string>();
        allOrders.forEach(order => {
            if (order.status !== 'Paid' && order.status !== 'Cancelled') {
                occupiedIds.add(order.tableId);
            }
        });
        return occupiedIds;
    }, [allOrders]);

    const vacantTables = useMemo(() => {
        return sortedTables.filter(t => !occupiedTableIds.has(t.id));
    }, [sortedTables, occupiedTableIds]);

    const addToCart = (item: MenuItem) => {
        setCart((prev) => {
            const existing = prev.find((i) => i.menuItem.id === item.id);
            if (existing) {
                return prev.map((i) =>
                    i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                );
            }
            return [...prev, { menuItem: item, quantity: 1 }];
        });
    };

    const updateQuantity = (itemId: string, quantity: number) => {
        setCart((prev) => {
            if (quantity <= 0) {
                return prev.filter((i) => i.menuItem.id !== itemId);
            }
            return prev.map((i) =>
                i.menuItem.id === itemId ? { ...i, quantity } : i
            );
        });
    };

    const removeItemFromCart = (itemId: string) => {
        setCart(prev => prev.filter(i => i.menuItem.id !== itemId));
    };

    const cartTotal = useMemo(() => {
        return cart.reduce((acc, item) => acc + item.menuItem.price * item.quantity, 0);
    }, [cart]);

    const placeOrder = () => {
        if (cart.length === 0 || !selectedTableId) return;
        addOrder({
            tableId: selectedTableId,
            items: cart,
        });
        onOpenChange(false);
    };

    const filteredMenuItems = useMemo(() => menuItems.filter(item => item.category === activeTab), [activeTab, menuItems]);
    const selectedTable = useMemo(() => tables.find(t => t.id === selectedTableId), [tables, selectedTableId]);


    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-full max-w-none sm:max-w-none md:max-w-2xl lg:max-w-4xl flex flex-col">
                <SheetHeader>
                    <SheetTitle>Create New Order</SheetTitle>
                    <SheetDescription>Select a table, add items to the order, and send it to the kitchen.</SheetDescription>
                </SheetHeader>

                {!selectedTableId ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <h3 className="text-xl font-semibold mb-4">Select a Table to Begin</h3>
                        <p className="text-muted-foreground mb-6">Choose a vacant table to start placing an order.</p>
                        <Select onValueChange={setSelectedTableId}>
                            <SelectTrigger className="w-[280px]">
                                <SelectValue placeholder="Choose a vacant table..." />
                            </SelectTrigger>
                            <SelectContent>
                                {vacantTables.length > 0 ? (
                                    vacantTables.map(table => (
                                        <SelectItem key={table.id} value={table.id}>
                                            {table.name}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-sm text-muted-foreground">No vacant tables available.</div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                ) : (
                    <div className="flex-1 grid grid-cols-3 gap-6 overflow-hidden pt-4">
                        {/* Menu Section */}
                        <div className="col-span-2 flex flex-col overflow-hidden">
                             <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col overflow-hidden">
                                <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
                                {menuCategories.map((cat) => (
                                    <TabsTrigger key={cat} value={cat}>{cat}</TabsTrigger>
                                ))}
                                </TabsList>
                                 <div className="flex-1 overflow-y-auto mt-4">
                                     <AnimatePresence mode="wait">
                                        <motion.div
                                            key={activeTab}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.2 }}
                                            className="pr-4"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {filteredMenuItems.map((item) => (
                                                    <Card key={item.id} className="h-full flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                                                        <CardHeader className="p-3 pb-0">
                                                            <CardTitle className="text-base">{item.name}</CardTitle>
                                                        </CardHeader>
                                                        <CardContent className="flex-1 p-3">
                                                        <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                                                        </CardContent>
                                                        <CardFooter className="flex justify-between items-center mt-auto p-3 bg-muted/50">
                                                        <span className="font-semibold text-sm">₹{item.price.toFixed(2)}</span>
                                                        <Button size="sm" onClick={() => addToCart(item)}>Add</Button>
                                                        </CardFooter>
                                                    </Card>
                                                ))}
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            </Tabs>
                        </div>
                        {/* Cart Section */}
                        <div className="col-span-1 flex flex-col bg-muted/50 rounded-lg overflow-hidden">
                             <div className="p-4 border-b">
                                <h3 className="font-bold text-lg">Order for {selectedTable?.name}</h3>
                                 <Button variant="link" className="p-0 h-auto text-xs" onClick={() => setSelectedTableId(null)}>Change table</Button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {cart.length === 0 ? (
                                    <p className="text-muted-foreground text-center pt-8 text-sm">Cart is empty. Add items from the menu.</p>
                                ) : (
                                    cart.map(item => (
                                        <div key={item.menuItem.id} className="flex items-start gap-3">
                                            <div className="flex-1">
                                                <p className="font-semibold text-sm">{item.menuItem.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                                                    <span className="w-5 text-center">{item.quantity}</span>
                                                    <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-sm">₹{(item.menuItem.price * item.quantity).toFixed(2)}</p>
                                                 <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => removeItemFromCart(item.menuItem.id)}><Trash2 className="h-4 w-4"/></Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            {cart.length > 0 && (
                                <SheetFooter className="border-t p-4 bg-background mt-auto">
                                    <div className="w-full space-y-3">
                                        <div className="flex justify-between font-bold text-lg">
                                            <span>Total</span>
                                            <span>₹{cartTotal.toFixed(2)}</span>
                                        </div>
                                        <Button size="lg" className="w-full" onClick={placeOrder}>
                                            Place Order
                                        </Button>
                                    </div>
                                </SheetFooter>
                            )}
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
