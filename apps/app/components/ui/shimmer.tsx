import { cn } from '@/lib/utils';

interface ShimmerProps {
  className?: string;
}

export function Shimmer({ className }: ShimmerProps) {
  return (
    <div className={cn("animate-pulse", className)}>
      <div className="space-y-3">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
      </div>
    </div>
  );
}

export function ShimmerCard({ className }: ShimmerProps) {
  return (
    <div className={cn("animate-pulse", className)}>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="space-y-2">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-11/12"></div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    </div>
  );
}
