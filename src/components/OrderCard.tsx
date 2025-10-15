import type { Order } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import OrderStatusBadge from './OrderStatusBadge';
import { Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface OrderCardProps {
  order: Order;
  children?: React.ReactNode;
}

export default function OrderCard({ order, children }: OrderCardProps) {
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
        <ul className="space-y-1 text-sm">
          {order.items.map((item, index) => (
            <li key={index} className="flex justify-between">
              <span>{item.quantity} x {item.menuItem.name}</span>
              <span>₹{(item.quantity * item.menuItem.price).toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="flex flex-col items-start pt-4 border-t">
        <div className="w-full flex justify-between font-bold text-md mb-2">
          <span>Total</span>
          <span>₹{order.total.toFixed(2)}</span>
        </div>
        {children && <div className="w-full">{children}</div>}
      </CardFooter>
    </Card>
  );
}
