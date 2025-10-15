'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const apps = [
  { name: 'Customer', href: '/' },
  { name: 'KDS', href: '/kds' },
  { name: 'Captain', href: '/captain' },
  { name: 'POS', href: '/pos' },
];

export default function AppSwitcher() {
  const pathname = usePathname();

  return (
    <nav className="rounded-lg border bg-card p-1">
      <ul className="flex items-center gap-1">
        {apps.map((app) => (
          <li key={app.href}>
            <Button
              asChild
              variant={pathname === app.href ? 'default' : 'ghost'}
              size="sm"
              className="transition-colors"
            >
              <Link href={app.href}>{app.name}</Link>
            </Button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
