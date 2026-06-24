import { Skeleton } from '@/components/ui/skeleton';

export default function StreamDashboardLoading() {
  return (
    <div className="w-full p-4 space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="size-4 rounded" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border p-5 space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-px w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ))}
    </div>
  );
}
