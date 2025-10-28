'use client';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Utensils, Zap, ShoppingBag, Truck } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Order, OnlinePlatform } from '@/lib/types';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { menuItems as initialMenuItems } from '@/lib/data';
import { useOrders } from '@/firebase';
import { useFirestore } from '@/firebase/provider';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('1234567890', 6);

const getRandomItems = (): { menuItem: any; quantity: number }[] => {
    const items = [];
    const numItems = Math.floor(Math.random() * 3) + 1; // 1 to 3 items
    const shuffled = [...initialMenuItems].sort(() => 0.5 - Math.random());
    for (let i = 0; i < numItems; i++) {
        items.push({
            menuItem: shuffled[i],
            quantity: Math.floor(Math.random() * 2) + 1, // 1 or 2 quantity
        });
    }
    return items;
};

const useMockOrderGenerator = (platform: OnlinePlatform, isEnabled: boolean) => {
    const firestore = useFirestore();
    const { toast } = useToast();

    useEffect(() => {
        if (!isEnabled) return;

        const generateOrder = async () => {
            const platformOrderId = `${platform.slice(0,1)}${Math.floor(1000 + Math.random() * 9000)}`;
            const items = getRandomItems();
            const total = items.reduce((acc, item) => acc + item.menuItem.price * item.quantity, 0);

            const newOrder = {
                orderType: 'online',
                onlinePlatform: platform,
                platformOrderId: platformOrderId,
                customerDetails: {
                    name: 'Random Customer',
                    phone: '9876543210',
                    address: '123, Mock Address, City'
                },
                items: items.map(i => ({...i, kotStatus: 'New', itemStatus: 'Pending', kotId: `KOT-${nanoid()}`})),
                status: 'New',
                timestamp: serverTimestamp(),
                total: total,
                originalTotal: total,
                kotCounter: 0,
            };

            const docRef = await addDoc(collection(firestore, 'orders'), newOrder);
            await updateDoc(docRef, { id: docRef.id });

            toast({
                title: 'New Online Order!',
                description: `Order #${platformOrderId} from ${platform} has arrived.`,
            });
        };

        const interval = setInterval(generateOrder, Math.random() * 20000 + 15000); // 15-35 seconds

        return () => clearInterval(interval);
    }, [platform, firestore, toast, isEnabled]);
};


const OnlineOrderCard = ({ order }: { order: Order }) => {
    const firestore = useFirestore();
    const updateOrderStatus = async (status: Order['status']) => {
        await updateDoc(doc(firestore, 'orders', order.id), { status });
    };

    const handleNextAction = () => {
        switch (order.status) {
            case 'Accepted':
                updateOrderStatus('Preparing');
                break;
            case 'Food Ready':
                updateOrderStatus('Out for Delivery');
                break;
            case 'Out for Delivery':
                updateOrderStatus('Delivered');
                break;
        }
    }

    const nextActionLabel = () => {
        switch (order.status) {
            case 'Accepted': return 'Mark as Preparing';
            case 'Food Ready': return 'Dispatch';
            case 'Out for Delivery': return 'Mark as Delivered';
            default: return null;
        }
    }

    const actionLabel = nextActionLabel();

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
        >
            <Card className="h-full flex flex-col">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-base">Order #{order.platformOrderId || order.id}</CardTitle>
                            <CardDescription>
                                {order.timestamp ? formatDistanceToNow(order.timestamp, { addSuffix: true }) : 'just now'}
                            </CardDescription>
                        </div>
                        <OrderStatusBadge status={order.status} />
                    </div>
                </CardHeader>
                <CardContent className="flex-1">
                    <p className="font-semibold">{order.customerDetails?.name}</p>
                    <p className="text-sm text-muted-foreground">{order.customerDetails?.phone}</p>
                    <Separator className="my-2" />
                    <div className="space-y-1 text-sm">
                        {order.items.map(item => (
                            <div key={item.menuItem.id} className="flex justify-between">
                                <span>{item.quantity} x {item.menuItem.name}</span>
                                <span className="font-mono">₹{(item.quantity * item.menuItem.price).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col items-stretch">
                     <div className="flex justify-between font-bold text-lg mb-2">
                        <span>Total</span>
                        <span>₹{order.total.toFixed(2)}</span>
                    </div>
                    {order.status === 'New' && (
                        <Button onClick={() => updateOrderStatus('Accepted')}>Accept Order</Button>
                    )}
                    {actionLabel && (
                        <Button onClick={handleNextAction}>{actionLabel}</Button>
                    )}
                     {order.status !== 'New' && (
                        <Button variant="destructive" className="mt-2" onClick={() => updateOrderStatus('Cancelled')}>Cancel Order</Button>
                    )}
                </CardFooter>
            </Card>
        </motion.div>
    );
};


const PlatformTabContent = ({ platform, isLive }: { platform: OnlinePlatform, isLive: boolean }) => {
    const { data: allOrders } = useOrders();
    useMockOrderGenerator(platform, isLive);

    const onlineOrders = useMemo(() => {
        return allOrders.filter(o => 
            o.orderType === 'online' && 
            o.onlinePlatform === platform && 
            o.status !== 'Delivered' && 
            o.status !== 'Cancelled'
        ).sort((a,b) => a.timestamp - b.timestamp);
    }, [allOrders, platform]);

    return (
        <AnimatePresence>
            {onlineOrders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {onlineOrders.map(order => <OnlineOrderCard key={order.id} order={order} />)}
                </div>
            ) : (
                <div className="text-center py-20">
                    <p className="text-muted-foreground">Listening for new orders from {platform}...</p>
                </div>
            )}
        </AnimatePresence>
    )
}

export default function OnlineOrdersView() {
    const [isLive, setIsLive] = useState(false);

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold font-headline">Online Orders</h2>
                 <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-muted-foreground">
                        {isLive ? "Receiving Live Orders" : "Simulation Paused"}
                    </span>
                    <Button onClick={() => setIsLive(prev => !prev)} variant={isLive ? "destructive" : "default"}>
                        {isLive ? "Stop Live Orders" : "Start Receiving Orders"}
                    </Button>
                </div>
            </div>
            
            <Tabs defaultValue="Zomato" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="Zomato"><Zap className="mr-2 h-4 w-4 text-red-500" />Zomato</TabsTrigger>
                    <TabsTrigger value="Swiggy"><ShoppingBag className="mr-2 h-4 w-4 text-orange-500" />Swiggy</TabsTrigger>
                    <TabsTrigger value="Others"><Utensils className="mr-2 h-4 w-4" />Others</TabsTrigger>
                </TabsList>
                <TabsContent value="Zomato" className="mt-6">
                   <PlatformTabContent platform="Zomato" isLive={isLive} />
                </TabsContent>
                <TabsContent value="Swiggy" className="mt-6">
                   <PlatformTabContent platform="Swiggy" isLive={isLive} />
                </TabsContent>
                <TabsContent value="Others" className="mt-6">
                    <PlatformTabContent platform="Others" isLive={isLive} />
                </TabsContent>
            </Tabs>
        </>
    )
}
