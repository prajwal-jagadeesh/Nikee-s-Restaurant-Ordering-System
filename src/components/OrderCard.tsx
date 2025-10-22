'use client';
import type { Order, OrderItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Clock, ChefHat, ArrowRightLeft, Pen, Trash2, BellRing } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import ItemStatusBadge from './ItemStatusBadge';
import { Button } from './ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { groupBy } from 'lodash';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface OrderCardProps {
  order: Order;
  children?: React.ReactNode;
  onServeItem?: (orderId: string, menuItemId: string) => void;
  showKotDetails?: boolean;
  tableName?: string;
  onSwitchTable?: () => void;
  onEditItems?: () => void;
  onCancelOrder?: () => void;
  onAcknowledgeAssistance?: () => void;
}

const ItemRow = ({ item, isNew }: { item: OrderItem; isNew: boolean }) => (
  <li className="flex justify-between items-center text-sm py-1">
    <span className="flex items-center">
      {item.quantity} x {item.menuItem.name}
    </span>
    {isNew 
      ? <Badge variant="outline" className="border-yellow-500 text-yellow-500 text-xs">New</Badge> 
      : <ItemStatusBadge status={item.itemStatus} />
    }
  </li>
);


export default function OrderCard({ 
    order, 
    children, 
    onServeItem, 
    showKotDetails = true, 
    tableName,
    onSwitchTable,
    onEditItems,
    onCancelOrder,
    onAcknowledgeAssistance,
}: OrderCardProps) {
  const newItems = order.items.filter(i => i.kotStatus === 'New');
  const printedItems = order.items.filter(i => i.kotStatus === 'Printed');
  
  const readyItems = onServeItem ? printedItems.filter(i => i.itemStatus === 'Ready') : [];
  
  const itemsForDisplay = !showKotDetails 
    ? printedItems.filter(i => i.itemStatus !== 'Ready') 
    : printedItems;
  
  const groupedPrintedItems = groupBy(itemsForDisplay, 'kotId');

  const showOrderDetailsHeader = !showKotDetails && itemsForDisplay.length > 0;
  const displayName = tableName || `Table ${order.tableId}`;

  return (
    <Card className="flex flex-col h-full shadow-md hover:shadow-lg transition-shadow duration-300 relative">
      {order.assistanceRequested && (
          <div className="absolute top-2 right-2 z-10">
              <TooltipProvider>
                  <Tooltip>
                      <TooltipTrigger asChild>
                           <Button size="icon" variant="destructive" className="h-10 w-10 rounded-full animate-bounce" onClick={onAcknowledgeAssistance}>
                                <BellRing />
                           </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Customer needs assistance!</p></TooltipContent>
                  </Tooltip>
              </TooltipProvider>
          </div>
      )}
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
            <CardTitle className="text-lg font-headline">{displayName}</CardTitle>
             <div className="flex items-center text-sm text-muted-foreground mt-1">
                <Clock className="h-4 w-4 mr-1.5" />
                <span>{formatDistanceToNow(new Date(order.timestamp), { addSuffix: true })}</span>
            </div>
            <p className="text-xs text-muted-foreground font-semibold mt-1">ID: {order.id}</p>
        </div>
        <div className="flex gap-1">
          <TooltipProvider>
            {onSwitchTable && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onSwitchTable}><ArrowRightLeft className="h-4 w-4"/></Button>
                </TooltipTrigger>
                <TooltipContent><p>Switch Table</p></TooltipContent>
              </Tooltip>
            )}
             {onEditItems && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEditItems}><Pen className="h-4 w-4"/></Button>
                </TooltipTrigger>
                <TooltipContent><p>Edit New Items</p></TooltipContent>
              </Tooltip>
            )}
             {onCancelOrder && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onCancelOrder}><Trash2 className="h-4 w-4"/></Button>
                </TooltipTrigger>
                <TooltipContent><p>Cancel Order</p></TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-2 pt-2">
        {newItems.length > 0 && (
          <>
            <Separator />
            <h4 className="text-sm font-semibold text-center text-muted-foreground pt-2">New Items</h4>
            <ul className="space-y-1 text-sm divide-y">
              {newItems.map((item, index) => (
                <ItemRow key={`${item.menuItem.id}-${index}`} item={item} isNew={true} />
              ))}
            </ul>
          </>
        )}

        {showKotDetails && Object.keys(groupedPrintedItems).length > 0 && (
          <>
          <Separator />
          <Accordion type="single" collapsible className="w-full" defaultValue={Object.keys(groupedPrintedItems).length > 0 ? `item-${Object.keys(groupedPrintedItems)[0]}` : undefined}>
            <AccordionItem value="printed-kots" className="border-none">
              <AccordionTrigger className="text-sm font-semibold text-center text-muted-foreground justify-center py-2 hover:no-underline">
                Show Printed KOTs
              </AccordionTrigger>
              <AccordionContent>
                {Object.entries(groupedPrintedItems).map(([kotId, items]) => (
                  <div key={kotId} className="mb-4">
                    <div className="flex items-center justify-center text-xs font-semibold text-muted-foreground mb-1">
                      <ChefHat className="h-3 w-3 mr-1" /> {kotId}
                    </div>
                    <ul className="space-y-1 text-sm divide-y border rounded-md p-2">
                       {items.map((item, index) => (
                          <ItemRow key={`${item.menuItem.id}-${index}`} item={item} isNew={false}/>
                       ))}
                    </ul>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          </>
        )}
        
        {showOrderDetailsHeader && (
            <>
                <Separator />
                <h4 className="text-sm font-semibold text-center text-muted-foreground pt-2">Order Details</h4>
                <ul className="space-y-1 text-sm divide-y">
                    {itemsForDisplay.map((item, index) => (
                        <ItemRow key={`${item.menuItem.id}-${index}`} item={item} isNew={false} />
                    ))}
                </ul>
            </>
        )}

        {readyItems.length > 0 && onServeItem && (
          <>
            <Separator />
            <div className="space-y-2">
                <h4 className="text-sm font-semibold text-center text-muted-foreground pt-2">Ready to Serve</h4>
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
