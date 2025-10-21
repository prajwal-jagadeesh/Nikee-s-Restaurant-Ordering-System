import type { Order, OrderItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import OrderStatusBadge from './OrderStatusBadge';
import { Clock, Asterisk } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import ItemStatusBadge from './ItemStatusBadge';
import { Button } from './ui/button';

interface OrderCardProps {
  order: Order;
  children?: React.ReactNode;
  onServeItem?: (orderId: string, menuItemId: string) => void;
}

const ItemRow = ({ item }: { item: OrderItem }) => (
  <li className="flex justify-between items-center text-sm py-1">
    <span className="flex items-center">
      {item.quantity} x {item.menuItem.name}
      {item.kotStatus === 'New' && (
        <Badge variant="outline" className="ml-2 border-yellow-500 text-yellow-500 text-xs">New</Badge>
      )}
    </span>
    <ItemStatusBadge status={item.itemStatus} />
  </li>
);


export default function OrderCard({ order, children, onServeItem }: OrderCardProps) {

  const itemsForDisplay = order.items.filter(i => i.itemStatus !== 'Ready' || !onServeItem);
  const readyItems = onServeItem ? order.items.filter(i => i.itemStatus === 'Ready') : [];


  return (
    <Card className="flex flex-col h-full shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-headline">Table {order.tableNumber}</CardTitle>
        <OrderStatusBadge status={order.status} />
      </CardHeader>
      <CardContent className="flex-1 space-y-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="h-4 w-4 mr-1.5" />
          <span>{formatDistanceToNow(new Date(order.timestamp), { addSuffix: true })}</span>
        </div>
        <p className="text-sm text-muted-foreground font-semibold">ID: {order.id}</p>
        <Separator />
        <ul className="space-y-1 text-sm divide-y">
          {itemsForDisplay.map((item, index) => (
            <ItemRow key={`${item.menuItem.id}-${index}`} item={item} />
          ))}
        </ul>
        {readyItems.length > 0 && onServeItem && (
          <>
            <Separator />
            <div className="space-y-2">
                <h4 className="text-sm font-semibold text-center text-muted-foreground">Ready to Serve</h4>
                <ul className="space-y-2">
                  {readyItems.map(item => (
                    <li key={item.menuItem.id} className="flex justify-between items-center bg-green-50 dark:bg-green-900/20 p-2 rounded-md">
                      <span className="font-medium text-sm">{item.quantity} x {item.menuItem.name}</span>
                      <Button size="sm" onClick={() => onServeItem(order.id, item.menuItem.id)}>
                        Mark Served
                      </Button>
                    </li>
                  ))}
                </ul>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-start pt-4 border-t">
        <div className="w-full flex justify-between font-bold text-md mb-4">
          <span>Total</span>
          <span>₹{order.total.toFixed(2)}</span>
        </div>
        {children && <div className="w-full">{children}</div>}
      </CardFooter>
    </Card>
  );
}
