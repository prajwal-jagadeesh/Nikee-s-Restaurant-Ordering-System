'use client';
import { Suspense, useState } from 'react';
import CaptainView from './CaptainView';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import NewOrderSheet from '@/app/captain/NewOrderSheet';

export default function CaptainPage() {
  const [isNewOrderSheetOpen, setNewOrderSheetOpen] = useState(false);
  return (
    <div className="flex-1">
      <header className="bg-card border-b">
        <div className="container mx-auto py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold font-headline">Captain Dashboard</h1>
          <Button onClick={() => setNewOrderSheetOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New / Add to Order
          </Button>
        </div>
      </header>
      <main className="container mx-auto py-4">
        <Suspense fallback={<Skeleton className="h-[80vh] w-full" />}>
          <CaptainView />
        </Suspense>
      </main>
      <NewOrderSheet isOpen={isNewOrderSheetOpen} onOpenChange={setNewOrderSheetOpen} />
    </div>
  );
}
