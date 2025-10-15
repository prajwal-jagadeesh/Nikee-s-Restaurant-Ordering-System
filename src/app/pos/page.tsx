import POSView from './POSView';

export default function POSPage() {
  return (
    <div className="flex-1">
       <header className="bg-card border-b">
        <div className="container mx-auto py-4">
          <h1 className="text-2xl font-bold font-headline">Point of Sale (POS)</h1>
        </div>
      </header>
      <main className="container mx-auto py-4">
        <POSView />
      </main>
    </div>
  );
}
