'use client';
import type { Order, Table } from '@/lib/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Printer } from 'lucide-react';

interface BillPreviewSheetProps {
    order: Order | null;
    table: Table | null;
    onClose: () => void;
    onConfirm: (orderId: string) => void;
}

export default function BillPreviewSheet({ order, table, onClose, onConfirm }: BillPreviewSheetProps) {

    if (!order || !table) return null;

    return (
        <Sheet open={!!order} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <SheetContent className="w-full max-w-md flex flex-col font-mono text-sm">
                <SheetHeader>
                    <SheetTitle className="font-mono text-center text-lg">Nikee's Zara</SheetTitle>
                    <SheetDescription className="font-mono text-center">
                        Rooftop Multicuisine
                        <br />
                        Bill / Invoice
                    </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto my-4 -mx-2 px-2">
                    <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                            <span>Order ID: {order.id}</span>
                            <span>Table: {table.name}</span>
                        </div>
                         <div className="flex justify-between">
                            <span>Date: {new Date(order.timestamp).toLocaleDateString()}</span>
                            <span>Time: {new Date(order.timestamp).toLocaleTimeString()}</span>
                        </div>
                    </div>
                    <Separator className="my-3 border-dashed" />
                    <div className="grid grid-cols-12 gap-2 font-bold">
                        <div className="col-span-1 text-right">#</div>
                        <div className="col-span-6">Item</div>
                        <div className="col-span-1 text-center">Qty</div>
                        <div className="col-span-2 text-right">Rate</div>
                        <div className="col-span-2 text-right">Amount</div>
                    </div>
                    <Separator className="my-2" />
                     <div className="space-y-1">
                        {order.items.map((item, index) => (
                            <div key={item.menuItem.id} className="grid grid-cols-12 gap-2 items-start">
                                <div className="col-span-1 text-right">{index + 1}</div>
                                <div className="col-span-6 break-words">{item.menuItem.name}</div>
                                <div className="col-span-1 text-center">{item.quantity}</div>
                                <div className="col-span-2 text-right">{item.menuItem.price.toFixed(2)}</div>
                                <div className="col-span-2 text-right font-semibold">{(item.menuItem.price * item.quantity).toFixed(2)}</div>
                            </div>
                        ))}
                    </div>
                     <Separator className="my-3 border-dashed" />
                     <div className="space-y-2 text-xs">
                        <div className="flex justify-between font-semibold">
                            <span>Subtotal</span>
                            <span>₹{order.total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Taxes (0%)</span>
                            <span>₹0.00</span>
                        </div>
                     </div>
                      <Separator className="my-3 border-dashed" />
                      <div className="flex justify-between font-bold text-lg">
                        <span>GRAND TOTAL</span>
                        <span>₹{order.total.toFixed(2)}</span>
                      </div>
                </div>
                <SheetFooter>
                    <Button size="lg" className="w-full font-sans" onClick={() => onConfirm(order.id)}>
                        <Printer className="mr-2 h-4 w-4" /> Confirm &amp; Generate Bill
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
