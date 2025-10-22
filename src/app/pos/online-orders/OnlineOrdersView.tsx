'use client';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Utensils, Zap, ShoppingBag, Truck } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHydratedStore, useOrderStore } from '@/lib/orders-store';
import type { Order, OnlinePlatform } from '@/lib/types';
import NewOnlineOrderSheet from './NewOnlineOrderSheet';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import { Separator } from '@/components/ui/separator';

const OnlineOrderCard = ({ order }: { order: Order }) => {
    const updateOrderStatus = useOrderStore(state => state.updateOrderStatus);

    const handleNextAction = () => {
        switch (order.status) {
            case 'Accepted':
                updateOrderStatus(order.id, 'Preparing');
                break;
            case 'Food Ready':
                updateOrderStatus(order.id, 'Out for Delivery');
                break;
            case 'Out for Delivery':
                updateOrderStatus(order.id, 'Delivered');
                break;
        }
    }

    const nextActionLabel = () => {
        switch (order.status) {
            case 'Accepted': return 'Start Preparing';
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
                                {formatDistanceToNow(order.timestamp, { addSuffix: true })}
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
                    {actionLabel && (
                        <Button onClick={handleNextAction}>{actionLabel}</Button>
                    )}
                </CardFooter>
            </Card>
        </motion.div>
    );
};


const PlatformTabContent = ({ platform }: { platform: OnlinePlatform }) => {
    const allOrders = useHydratedStore(useOrderStore, state => state.orders, []);
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
                    <p className="text-muted-foreground">No active orders from {platform}.</p>
                </div>
            )}
        </AnimatePresence>
    )
}

export default function OnlineOrdersView() {
    const [isSheetOpen, setSheetOpen] = useState(false);

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold font-headline">Online Orders</h2>
                <Button onClick={() => setSheetOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Online Order
                </Button>
            </div>
            
            <Tabs defaultValue="Zomato" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="Zomato"><Zap className="mr-2 h-4 w-4 text-red-500" />Zomato</TabsTrigger>
                    <TabsTrigger value="Swiggy"><ShoppingBag className="mr-2 h-4 w-4 text-orange-500" />Swiggy</TabsTrigger>
                    <TabsTrigger value="Others"><Utensils className="mr-2 h-4 w-4" />Others</TabsTrigger>
                </TabsList>
                <TabsContent value="Zomato" className="mt-6">
                   <PlatformTabContent platform="Zomato" />
                </TabsContent>
                <TabsContent value="Swiggy" className="mt-6">
                   <PlatformTabContent platform="Swiggy" />
                </TabsContent>
                <TabsContent value="Others" className="mt-6">
                    <PlatformTabContent platform="Others" />
                </TabsContent>
            </Tabs>

            <NewOnlineOrderSheet isOpen={isSheetOpen} onOpenChange={setSheetOpen} />
        </>
    )
}
