import KDSView from './KDSView';

export default function KDSPage() {
  return (
    <div className="flex-1">
      <header className="bg-card border-b">
        <div className="container mx-auto py-4">
          <h1 className="text-2xl font-bold font-headline">Kitchen Display System</h1>
        </div>
      </header>
      <main className="container mx-auto py-4">
        <KDSView />
      </main>
    </div>
  );
}
