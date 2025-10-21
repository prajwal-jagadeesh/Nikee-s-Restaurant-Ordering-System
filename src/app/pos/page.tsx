import { Suspense } from 'react';
import POSView from './POSView';
import { Skeleton } from '@/components/ui/skeleton';

export default function POSPage() {
  return (
    <div className="flex-1">
      <header className="bg-card border-b">
        <div className="container mx-auto flex h-16 items-center">
          <h1 className="text-2xl font-bold font-headline">Point of Sale (POS)</h1>
        </div>
      </header>
      <main className="flex-1">
        <Suspense fallback={<Skeleton className="h-[calc(100vh-4rem)] w-full" />}>
          <POSView />
        </Suspense>
      </main>
    </div>
  );
}
