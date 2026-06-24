import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardStreamsLoading() {
  return (
    <div className="w-full p-4 space-y-4">
      <div className="flex justify-end">
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="rounded-xl border overflow-hidden">
        <div className="px-4 py-3 border-b">
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <Skeleton className="h-4 w-48" />
              <div className="flex items-center gap-6">
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-7 w-16 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
