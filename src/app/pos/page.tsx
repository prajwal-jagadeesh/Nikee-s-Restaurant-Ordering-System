'use client';
import { Suspense, useState } from 'react';
import POSView from './POSView';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export default function POSPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex-1">
      <header className="bg-card border-b sticky top-16 z-40">
        <div className="container mx-auto flex h-16 items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-4"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold font-headline">Point of Sale (POS)</h1>
        </div>
      </header>
      <main className="flex-1">
        <Suspense fallback={<Skeleton className="h-[calc(100vh-8rem)] w-full" />}>
          <POSView isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
        </Suspense>
      </main>
    </div>
  );
}
