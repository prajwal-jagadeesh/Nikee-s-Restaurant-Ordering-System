import { Badge } from '@/components/ui/badge';
import type { ItemStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ItemStatusBadgeProps {
    status: ItemStatus;
    className?: string;
}

const colors: Record<ItemStatus, string> = {
    'Pending': 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300 dark:border-cyan-800/60',
    'Preparing': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-800/60',
    'Ready': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800/60',
    'Served': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800/60',
  }

export default function ItemStatusBadge({ status, className }: ItemStatusBadgeProps) {
  return (
    <Badge className={cn('hover:bg-none font-semibold', colors[status], className)}>
      {status}
    </Badge>
  );
}
