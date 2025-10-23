'use client';
import { useMemo } from 'react';
import type { Order, OrderItem, Table } from '@/lib/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Printer, ChefHat } from 'lucide-react';
import { maxBy } from 'lodash';


interface KOTPreviewSheetProps {
    order: Order | null;
    table: Table | null;
    onClose: () => void;
    onConfirm: (order: Order) => void;
    mode: 'new' | 'reprint';
    kotId?: string | null;
}

// Helper to group items for display
const groupItemsForDisplay = (items: OrderItem[]) => {
    const grouped = new Map<string, OrderItem>();
    items.forEach(item => {
        const existing = grouped.get(item.menuItem.id);
        if (existing) {
            existing.quantity += item.quantity;
        } else {
            grouped.set(item.menuItem.id, { ...item, quantity: item.quantity });
        }
    });
    return Array.from(grouped.values());
};

export default function KOTPreviewSheet({ order, table, onClose, onConfirm, mode, kotId }: KOTPreviewSheetProps) {
    const itemsToDisplay = useMemo(() => {
        if (!order) return [];

        if (mode === 'reprint') {
             if (!kotId) return [];
             return order.items.filter(item => item.kotId === kotId);
        }
        // mode === 'new'
        return order.items.filter(item => item.kotStatus === 'New');

    }, [order, mode, kotId]);

    if (!order || !table || itemsToDisplay.length === 0) return null;
    
    const groupedItems = groupItemsForDisplay(itemsToDisplay);
    const buttonText = mode === 'reprint' ? 'Print Duplicate KOT' : 'Confirm & Print KOT';
    const titleText = mode === 'reprint' ? `DUPLICATE ${kotId}` : 'KOT';


    return (
        <Sheet open={!!order} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <SheetContent className="w-full max-w-sm flex flex-col font-mono text-sm">
                <SheetHeader>
                    <SheetTitle className="font-mono text-center">{titleText}</SheetTitle>
                    <SheetDescription className="font-mono text-center">
                        <p className="font-bold">{table.name}</p>
                        <p className="text-xs">Order ID: {order.id}</p>
                        <p className="text-xs">{new Date(order.timestamp).toLocaleString()}</p>
                    </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto my-4 -mx-2 px-2 border-y border-dashed py-4">
                    {groupedItems.map(item => (
                        <div key={item.menuItem.id} className="flex items-center justify-between py-1">
                            <span className="font-bold text-lg mr-4">{item.quantity} x</span>
                            <span className="flex-1 text-base">{item.menuItem.name}</span>
                        </div>
                    ))}
                </div>
                <SheetFooter>
                    <Button size="lg" className="w-full font-sans" onClick={() => onConfirm(order)}>
                        <Printer className="mr-2 h-4 w-4" /> {buttonText}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
