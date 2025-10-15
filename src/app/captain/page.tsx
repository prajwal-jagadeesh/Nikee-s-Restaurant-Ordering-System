import CaptainView from './CaptainView';

export default function CaptainPage() {
  return (
    <div className="flex-1">
       <header className="bg-card border-b">
        <div className="container mx-auto py-4">
          <h1 className="text-2xl font-bold font-headline">Captain Dashboard</h1>
        </div>
      </header>
      <main className="container mx-auto py-4">
        <CaptainView />
      </main>
    </div>
  );
}
