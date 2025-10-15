'use client';
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { menuItems, menuCategories } from '@/lib/data';
import type { MenuItem, OrderItem, Order, OrderStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Plus, Minus, ShoppingCart, Trash2, RotateCcw, Flame } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { AnimatePresence, motion } from 'framer-motion';
import { useOrderStore, useHydratedOrderStore } from '@/lib/orders-store';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import OrderStatusBadge from '@/components/OrderStatusBadge';

const ActiveOrderStatus = ({ order }: { order: Order }) => {
  const statusInfo: Record<OrderStatus, { label: string, description: string, progress: number }> = {
    'New': { label: 'Waiting for Confirmation', description: 'Your order has been sent. A captain will confirm it shortly.', progress: 20 },
    'Confirmed': { label: 'Order Confirmed', description: 'The kitchen has received your order and will start preparing it soon.', progress: 40 },
    'Preparing': { label: 'Preparing', description: 'Your dishes are being prepared with care by our chefs.', progress: 60 },
    'Ready': { label: 'Ready', description: 'Your order is ready to be served.', progress: 80 },
    'Served': { label: 'Served', description: 'Enjoy your meal! Your order has been served.', progress: 100 },
    'Paid': { label: 'Paid', description: 'Thank you for your visit!', progress: 100 },
    'Cancelled': { label: 'Cancelled', description: 'This order has been cancelled.', progress: 0 },
  }

  const currentStatusInfo = statusInfo[order.status];

  return (
    <Card className="mb-6 bg-card/80 backdrop-blur-sm shadow-lg border-primary/20">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Your Active Order</span>
          <OrderStatusBadge status={order.status} />
        </CardTitle>
        <p className="text-sm text-muted-foreground pt-2">{currentStatusInfo.description}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
            {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                    <span>{item.quantity} x {item.menuItem.name}</span>
                    <span className="font-mono">₹{(item.quantity * item.menuItem.price).toFixed(2)}</span>
                </div>
            ))}
        </div>
        <Separator className="my-3" />
        <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>₹{order.total.toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export default function CustomerView() {
  const searchParams = useSearchParams();
  const tableNumber = searchParams.get('table') || '5';

  const orders = useHydratedOrderStore(state => state.orders, []);
  const addOrder = useOrderStore((state) => state.addOrder);
  const addItemsToOrder = useOrderStore((state) => state.addItemsToOrder);
  
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [activeTab, setActiveTab] = useState(menuCategories[0]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const activeOrder = useMemo(() => {
    return orders.find(o => o.tableNumber === parseInt(tableNumber) && o.status !== 'Paid' && o.status !== 'Cancelled');
  }, [orders, tableNumber]);

  const cartItems = useMemo(() => activeOrder ? activeOrder.items : cart, [activeOrder, cart]);

  const addToCart = (item: MenuItem, quantity = 1) => {
    if (activeOrder) {
      addItemsToOrder(activeOrder.id, [{ menuItem: item, quantity }]);
    } else {
      setCart((prev) => {
        const existing = prev.find((i) => i.menuItem.id === item.id);
        if (existing) {
          return prev.map((i) =>
            i.menuItem.id === item.id ? { ...i, quantity: i.quantity + quantity } : i
          );
        }
        return [...prev, { menuItem: item, quantity }];
      });
    }
    setIsCartOpen(true);
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (activeOrder) {
        // For active orders, we can't reduce quantity this way. Let's just allow removing.
        if (quantity <= 0) {
            // This is complex. For now, let's not allow modification, only adding.
            // A proper implementation would require a new store action.
        }
    } else {
        setCart((prev) => {
          if (quantity <= 0) {
            return prev.filter((i) => i.menuItem.id !== itemId);
          }
          return prev.map((i) =>
            i.menuItem.id === itemId ? { ...i, quantity } : i
          );
        });
    }
  };
  
  const removeItemFromCart = (itemId: string) => {
    if(!activeOrder) {
        setCart(prev => prev.filter(i => i.menuItem.id !== itemId));
    }
    // Cannot remove items from an active order in this UI.
  }

  const total = useMemo(() => {
    // If there's an active order, the "cart" is for placing a *new* order if needed,
    // or adding to the existing one. For the sheet total, we should only show the total for *new* items
    // if an order is already active.
    const itemsToTotal = activeOrder ? cart : cartItems;
    
    // When an order is active, the sheet is for adding *more* items.
    // So the cart should be for the items to add, not the whole order.
    // Let's adjust what we show in the cart sheet. If an order is active, show only newly added items.
    // The problem is `cart` is empty after placing an order.
    // Let's keep it simple: The sheet shows the NEW items to be placed, or items to be ADDED.
    // If order is active, total is for NEW items. If no order, total is for the whole cart.

    return cart.reduce((acc, item) => acc + item.menuItem.price * item.quantity, 0);

  }, [cart]);
  
  const placeOrder = () => {
    if (cart.length === 0) return;
    
    if (activeOrder) {
      addItemsToOrder(activeOrder.id, cart);
    } else {
      addOrder({
        id: '', // Will be set by the store
        tableNumber: parseInt(tableNumber),
        items: cart,
        status: 'New',
        timestamp: Date.now(),
        total: cart.reduce((acc, item) => acc + item.menuItem.price * item.quantity, 0),
      });
    }
    setCart([]);
    setIsCartOpen(false);
  };

  const filteredMenuItems = useMemo(() => menuItems.filter(item => item.category === activeTab), [activeTab]);
  const isItemInCart = (itemId: string) => activeOrder?.items.some(item => item.menuItem.id === itemId);

  const ReorderPopover = ({ item }: { item: MenuItem }) => {
    const [quantity, setQuantity] = useState(1);
    const [isOpen, setIsOpen] = useState(false);

    const handleReorder = () => {
      addItemsToOrder(activeOrder!.id, [{ menuItem: item, quantity }]);
      setIsOpen(false);
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" />
            Reorder
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Quantity</h4>
              <p className="text-sm text-muted-foreground">
                How many more?
              </p>
            </div>
            <div className="grid gap-2">
               <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full"
                />
              <Button onClick={handleReorder}>Add</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <>
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold font-headline">Welcome to Nikee's Zara</h1>
        <p className="text-lg text-muted-foreground">You are ordering for Table {tableNumber}</p>
      </div>

      {activeOrder && <ActiveOrderStatus order={activeOrder} />}

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9">
          {menuCategories.map((cat) => (
            <TabsTrigger key={cat} value={cat}>{cat}</TabsTrigger>
          ))}
        </TabsList>
        <AnimatePresence mode="wait">
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                    {filteredMenuItems.map((item) => (
                        <Card key={item.id} className="h-full flex flex-col overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 bg-card/70">
                            <CardHeader>
                                <CardTitle>{item.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1">
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                            </CardContent>
                            <CardFooter className="flex justify-between items-center mt-auto">
                            <span className="font-bold text-lg">₹{item.price.toFixed(2)}</span>
                            {isItemInCart(item.id) && activeOrder ? (
                                <ReorderPopover item={item} />
                            ) : (
                                <Button onClick={() => addToCart(item)}>Add to Order</Button>
                            )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </motion.div>
        </AnimatePresence>
      </Tabs>

      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetTrigger asChild>
          <Button className="fixed bottom-6 right-6 rounded-full h-16 w-16 shadow-lg">
            <ShoppingCart />
            {(cart.length) > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                {cart.reduce((acc, item) => acc + item.quantity, 0)}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="flex flex-col">
          <SheetHeader>
            <SheetTitle>
              {activeOrder ? `Add to Order (Table ${tableNumber})` : `New Order (Table ${tableNumber})`}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            {cart.length === 0 ? (
              <p className="text-muted-foreground text-center mt-8">Your cart is empty. Add items from the menu.</p>
            ) : (
              <div className="space-y-4 mt-4">
                {cart.map(item => (
                  <div key={item.menuItem.id} className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="font-semibold">{item.menuItem.name}</p>
                      <p className="text-sm text-muted-foreground">₹{item.menuItem.price.toFixed(2)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                        <span>{item.quantity}</span>
                        <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                      </div>
                    </div>
                    <div className="text-right">
                        <p className="font-semibold">₹{(item.menuItem.price * item.quantity).toFixed(2)}</p>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => removeItemFromCart(item.menuItem.id)}><Trash2 className="h-4 w-4"/></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {cart.length > 0 && (
            <SheetFooter className="border-t pt-4 mt-auto bg-background">
                <div className="w-full space-y-4">
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>₹{total.toFixed(2)}</span>
                    </div>
                    <Button size="lg" className="w-full" onClick={placeOrder}>
                      {activeOrder ? 'Add Items to Order' : 'Place Order'}
                    </Button>
                </div>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
