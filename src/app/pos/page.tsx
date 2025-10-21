import { Suspense } from 'react';
import POSView from './POSView';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function POSPage() {
  return (
    <div className="flex-1">
       <header className="bg-card border-b">
        <div className="container mx-auto py-4">
          <h1 className="text-2xl font-bold font-headline">Point of Sale (POS)</h1>
        </div>
      </header>
      <main className="container mx-auto py-4">
        <Suspense fallback={<Skeleton className="h-[80vh] w-full" />}>
          <POSView />
        </Suspense>
      </main>
    </div>
  );
}
