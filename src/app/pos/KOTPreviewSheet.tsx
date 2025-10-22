'use client';
import type { Order, OrderItem, Table } from '@/lib/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Printer, ChefHat } from 'lucide-react';

interface KOTPreviewSheetProps {
    order: Order | null;
    table: Table | null;
    onClose: () => void;
    onConfirm: (order: Order) => void;
}

export default function KOTPreviewSheet({ order, table, onClose, onConfirm }: KOTPreviewSheetProps) {
    if (!order || !table) return null;

    const newItems = order.items.filter(item => item.kotStatus === 'New');

    return (
        <Sheet open={!!order} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <SheetContent className="w-full max-w-sm flex flex-col font-mono text-sm">
                <SheetHeader>
                    <SheetTitle className="font-mono text-center">KOT</SheetTitle>
                    <SheetDescription className="font-mono text-center">
                        <p className="font-bold">{table.name}</p>
                        <p className="text-xs">Order ID: {order.id}</p>
                        <p className="text-xs">{new Date(order.timestamp).toLocaleString()}</p>
                    </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto my-4 -mx-2 px-2 border-y border-dashed py-4">
                    {newItems.map(item => (
                        <div key={item.menuItem.id} className="flex items-center justify-between py-1">
                            <span className="font-bold text-lg mr-4">{item.quantity} x</span>
                            <span className="flex-1 text-base">{item.menuItem.name}</span>
                        </div>
                    ))}
                </div>
                <SheetFooter>
                    <Button size="lg" className="w-full font-sans" onClick={() => onConfirm(order)}>
                        <Printer className="mr-2 h-4 w-4" /> Confirm &amp; Print KOT
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
