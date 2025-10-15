import { Suspense } from 'react';
import CustomerView from '@/app/customer/CustomerView';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <Suspense fallback={<Skeleton className="h-[80vh] w-full" />}>
        <CustomerView />
      </Suspense>
    </div>
  );
}
