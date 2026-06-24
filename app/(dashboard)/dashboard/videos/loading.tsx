import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardVideosLoading() {
  return (
    <div className="w-full p-4 space-y-4">
      <div className="flex justify-end">
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="rounded-xl border overflow-hidden">
        <div className="px-4 py-3 border-b">
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="divide-y">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="size-10 rounded shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-14 rounded-full" />
              <div className="flex gap-2">
                <Skeleton className="h-7 w-16 rounded" />
                <Skeleton className="h-7 w-7 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
