'use client';
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { MenuItem, OrderItem, Order, OrderStatus, Table } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetDescription } from '@/components/ui/sheet';
import { Plus, Minus, ShoppingCart, Trash2, RotateCcw, WifiOff, BellRing, Hand } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { AnimatePresence, motion } from 'framer-motion';
import { useOrderStore, useHydratedStore } from '@/lib/orders-store';
import { useTableStore } from '@/lib/tables-store';
import { useMenuStore } from '@/lib/menu-store';
import { useSettingsStore } from '@/lib/settings-store';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import ItemStatusBadge from '@/components/ItemStatusBadge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

const statusInfo: Record<OrderStatus, { label: string, description: string, progress: number }> = {
  'New': { label: 'Waiting for Confirmation', description: 'Your order has been sent. A captain will confirm it shortly.', progress: 20 },
  'Confirmed': { label: 'Order Confirmed', description: 'Your order has been confirmed and will be sent to the kitchen.', progress: 40 },
  'Preparing': { label: 'Preparing', description: 'Your dishes are being prepared with care by our chefs.', progress: 60 },
  'Ready': { label: 'Ready for Serving', description: 'Your order is ready and will be served shortly.', progress: 80 },
  'Served': { label: 'Served', description: 'Enjoy your meal! Your order has been served.', progress: 100 },
  'Billed': { label: 'Bill Generated', description: 'The bill has been generated. Please proceed to payment with the captain.', progress: 100 },
  'Paid': { label: 'Paid', description: 'Thank you for your visit!', progress: 100 },
  'Cancelled': { label: 'Cancelled', description: 'This order has been cancelled.', progress: 0 },
  Accepted: { label: 'Order Accepted', description: 'The restaurant has accepted your online order.', progress: 20 },
  'Food Ready': { label: 'Food is Ready', description: 'Your food is ready for pickup/delivery.', progress: 80 },
  'Out for Delivery': { label: 'Out for Delivery', description: 'Your order is on its way!', progress: 90 },
  Delivered: { label: 'Delivered', description: 'Your order has been delivered.', progress: 100 },
}

const useRedirectIfSwitched = (currentTable: Table | undefined) => {
    const router = useRouter();
    const allOrders = useHydratedStore(useOrderStore, state => state.orders, []);
    const allTables = useHydratedStore(useTableStore, state => state.tables, []);
    const clearSwitchedFrom = useOrderStore(state => state.clearSwitchedFrom);

    useEffect(() => {
        if (!currentTable) return;

        const switchedOrder = allOrders.find(o => o.switchedFrom === currentTable.id);
        
        if (switchedOrder) {
            const newTable = allTables.find(t => t.id === switchedOrder.tableId);
            if (newTable) {
                const newTableNumber = newTable.name.replace(/\D/g, '');
                clearSwitchedFrom(switchedOrder.id);
                router.replace(`/customer?table=${newTableNumber}`);
            }
        }
    }, [allOrders, currentTable, allTables, router, clearSwitchedFrom]);
};

// Haversine formula to calculate distance between two lat/lon points
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180; // φ, λ in radians
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const d = R * c; // in metres
    return d;
}

export default function CustomerView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tableNumberParam = searchParams.get('table') || '1';
  
  const tables = useHydratedStore(useTableStore, (state) => state.tables, []);
  const table = useMemo(() => tables.find(t => t.name.toLowerCase().replace(' ', '') === `table${tableNumberParam}`) || tables[0], [tables, tableNumberParam]);

  const orders = useHydratedStore(useOrderStore, state => state.orders, []);
  const addOrder = useOrderStore((state) => state.addOrder);
  const addItemsToOrder = useOrderStore((state) => state.addItemsToOrder);
  const requestAssistance = useOrderStore((state) => state.requestAssistance);
  const requestPayment = useOrderStore((state) => state.requestPayment);

  const allMenuItems = useHydratedStore(useMenuStore, state => state.menuItems, []);
  const menuItems = useMemo(() => allMenuItems.filter(item => item.available), [allMenuItems]);
  const menuCategories = useHydratedStore(useMenuStore, state => state.menuCategories, []);

  const restaurantLocation = useHydratedStore(useSettingsStore, state => state.location, { latitude: null, longitude: null });
  
  const [cart, setCart] = useState<Omit<OrderItem, 'kotStatus' | 'itemStatus'>[]>([]);
  const [activeTab, setActiveTab] = useState(menuCategories[0]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [locationState, setLocationState] = useState<{ status: 'idle' | 'checking' | 'ok' | 'error', message: string }>({ status: 'idle', message: '' });

  const { toast } = useToast();

  useEffect(() => {
    if (!restaurantLocation.latitude || !restaurantLocation.longitude) {
      setLocationState({ status: 'ok', message: '' }); // No location set, so we allow orders
      return;
    }

    setLocationState({ status: 'checking', message: 'Verifying your location...' });

    if (!navigator.geolocation) {
      setLocationState({ status: 'error', message: 'Geolocation is not supported by your browser.' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLon = position.coords.longitude;
        
        const distance = getDistance(userLat, userLon, parseFloat(restaurantLocation.latitude!), parseFloat(restaurantLocation.longitude!));
        
        if (distance <= 50) {
           setLocationState({ status: 'ok', message: 'Location verified.' });
           toast({
               title: "Location Verified",
               description: "You're cleared to place an order.",
               duration: 2000,
           });
        } else {
          setLocationState({ status: 'error', message: 'You are too far from the restaurant to place an order.' });
        }
      },
      () => {
        setLocationState({ status: 'error', message: 'Please enable location services to place an order.' });
         toast({
            variant: "destructive",
            title: "Location Access Denied",
            description: "To place an order, please allow location access in your browser settings.",
          });
      }
    );
  }, [restaurantLocation.latitude, restaurantLocation.longitude, toast]);


  useEffect(() => {
    if (menuCategories.length > 0) {
      setActiveTab(menuCategories[0]);
    }
  }, [menuCategories]);

  useRedirectIfSwitched(table);

  const activeOrder = useMemo(() => {
    if (!table) return undefined;
    return orders.find(o => o.tableId === table.id && o.status !== 'Paid' && o.status !== 'Cancelled');
  }, [orders, table]);

  const allItemsServed = useMemo(() => {
    if (!activeOrder) return false;
    const printedItems = activeOrder.items.filter(item => item.kotStatus === 'Printed');
    if (printedItems.length === 0) return false; // Nothing ordered that needs serving
    return printedItems.every(item => item.itemStatus === 'Served');
  }, [activeOrder]);

  const handleCallCaptain = () => {
    if (!activeOrder) return;
    requestAssistance(activeOrder.id, true);
    toast({
      title: "Captain has been called",
      description: "Someone will be with you shortly.",
    });
  };

  const handleReadyToPay = () => {
    if (!activeOrder) return;
    requestPayment(activeOrder.id, true);
    toast({
      title: "Payment Requested",
      description: "A staff member will bring the bill to your table.",
    });
  }

  const addToCart = (item: MenuItem, quantity = 1) => {
    if (locationState.status !== 'ok') return;
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItem.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItem.id === item.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { menuItem: item, quantity }];
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
  }

  const newItemsTotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.menuItem.price * item.quantity, 0);
  }, [cart]);
  
  const placeOrUpdateOrder = () => {
    if (locationState.status !== 'ok' || cart.length === 0 || !table) return;
    
    if (activeOrder) {
      addItemsToOrder(activeOrder.id, cart);
    } else {
      addOrder({
        tableId: table.id,
        items: cart,
      });
    }
    setCart([]);
    setIsCartOpen(false);
  };

  const filteredMenuItems = useMemo(() => menuItems.filter(item => item.category === activeTab), [activeTab, menuItems]);
  const isItemInCart = (itemId: string) => activeOrder?.items.some(item => item.menuItem.id === itemId && item.itemStatus !== 'Served');
  const cartItemCount = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);


  const ReorderPopover = ({ item }: { item: MenuItem }) => {
    const [quantity, setQuantity] = useState(1);
    const [isOpen, setIsOpen] = useState(false);

    const handleReorder = () => {
      addToCart(item, quantity);
      setIsOpen(false);
      setIsCartOpen(true);
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" disabled={locationState.status !== 'ok'}>
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
  
  if (!table) {
    return <div className="text-center py-10">
      <h1 className="text-2xl font-bold">Table not found</h1>
      <p>The requested table number does not exist.</p>
    </div>
  }


  return (
    <>
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold font-headline">Welcome to Nikee's Zara</h1>
        <p className="text-lg text-muted-foreground">You are ordering for {table.name}</p>
      </div>

       {locationState.status === 'error' && (
        <Alert variant="destructive" className="mb-6">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Order Placement Disabled</AlertTitle>
          <AlertDescription>
            {locationState.message}
          </AlertDescription>
        </Alert>
      )}

      {locationState.status === 'checking' && (
         <Alert className="mb-6">
          <AlertDescription className="text-center">
            {locationState.message}
          </AlertDescription>
        </Alert>
      )}

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
                            {isItemInCart(item.id) ? (
                                <ReorderPopover item={item} />
                            ) : (
                                <Button onClick={() => addToCart(item)} disabled={locationState.status !== 'ok'}>Add to Order</Button>
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
          <Button className="fixed bottom-6 right-6 rounded-full h-16 w-16 shadow-lg" disabled={locationState.status !== 'ok'}>
            <ShoppingCart />
            {(cartItemCount) > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="flex flex-col">
          <SheetHeader>
            <SheetTitle>
              {activeOrder ? `Order for ${table.name}` : `New Order (${table.name})`}
            </SheetTitle>
             <SheetDescription>
                {activeOrder && statusInfo[activeOrder.status] ? statusInfo[activeOrder.status].description : "Review your items before placing the order."}
              </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto -mx-6 px-6 divide-y">
            {activeOrder && (
              <div className="py-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-lg">Your Active Order</h3>
                    {/* <OrderStatusBadge status={activeOrder.status} /> */}
                  </div>
                  <div className="space-y-2">
                      {activeOrder.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                              <span className="flex-1">{item.quantity} x {item.menuItem.name}</span>
                              <ItemStatusBadge status={item.itemStatus} className="mx-2" />
                              <span className="font-mono w-20 text-right">₹{(item.quantity * item.menuItem.price).toFixed(2)}</span>
                          </div>
                      ))}
                  </div>
                  <Separator className="my-3" />
                  <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>₹{activeOrder.total.toFixed(2)}</span>
                  </div>
              </div>
            )}
            
            {cart.length === 0 && !activeOrder ? (
              <p className="text-muted-foreground text-center pt-8">Your cart is empty. Add items from the menu.</p>
            ) : null}

            {cart.length > 0 && (
                <div className="py-4">
                  <h3 className="font-semibold text-lg mb-2">{activeOrder ? "Add More Items" : "Your Items"}</h3>
                  <div className="space-y-4">
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
                </div>
            )}
          </div>
          
            <SheetFooter className="border-t pt-4 mt-auto bg-background">
                <div className="w-full space-y-4">
                   {cart.length > 0 && (
                     <>
                        <Separator />
                        <div className="flex justify-between font-bold text-lg">
                            <span>New Items Total</span>
                            <span>₹{newItemsTotal.toFixed(2)}</span>
                        </div>
                        {activeOrder && (
                        <div className="flex justify-between font-bold text-xl">
                            <span>New Grand Total</span>
                            <span>₹{(activeOrder.total + newItemsTotal).toFixed(2)}</span>
                        </div>
                        )}
                        <Button size="lg" className="w-full" onClick={placeOrUpdateOrder} disabled={locationState.status !== 'ok'}>
                        {activeOrder ? 'Add Items to Order' : 'Place Order'}
                        </Button>
                     </>
                   )}

                    {activeOrder && cart.length === 0 && (
                        <div className="space-y-2">
                             {allItemsServed && !activeOrder.paymentRequested ? (
                                <Button size="lg" className="w-full" onClick={handleReadyToPay}>Ready to Pay?</Button>
                            ) : (
                                 <Button 
                                    size="lg" 
                                    variant="outline" 
                                    className="w-full" 
                                    onClick={handleCallCaptain} 
                                    disabled={activeOrder.assistanceRequested}
                                >
                                    {activeOrder.assistanceRequested ? (
                                        <>
                                            <BellRing className="mr-2 h-4 w-4 animate-ping" />
                                            Captain is on the way
                                        </>
                                    ) : (
                                         <>
                                            <Hand className="mr-2 h-4 w-4" />
                                            Call for Assistance
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </SheetFooter>
          
        </SheetContent>
      </Sheet>
    </>
  );
}

    
