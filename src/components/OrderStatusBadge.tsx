import { Badge } from '@/components/ui/badge';
import type { OrderStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

const statusColors: Record<OrderStatus, string> = {
  New: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800/60',
  Preparing: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-800/60',
  Ready: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800/60',
  Served: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800/60',
  Billed: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800/60',
  Paid: 'bg-gray-200 text-gray-800 border-gray-300 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700/60',
  Cancelled: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800/60',
};

export default function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  return (
    <Badge className={cn('hover:bg-none font-semibold', statusColors[status], className)}>
      {status}
    </Badge>
  );
}
