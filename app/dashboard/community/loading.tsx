import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardCommunityLoading() {
  return (
    <div className="w-full p-4 space-y-4">
      <div className="flex justify-end">
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="rounded-xl border overflow-hidden">
        <div className="px-4 py-3 border-b">
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-56" />
                </div>
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="flex gap-2 ml-4">
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
