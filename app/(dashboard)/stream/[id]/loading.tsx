import { Skeleton } from '@/components/ui/skeleton';

export default function StreamLoading() {
  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Video area */}
      <div className="flex flex-1 flex-col min-w-0">
        <div className="flex h-12 shrink-0 items-center gap-3 border-b px-4">
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="flex-1 rounded-none" />
        <div className="h-12 shrink-0 border-t" />
      </div>
      {/* Sidebar */}
      <div className="flex w-72 shrink-0 flex-col border-l">
        <div className="flex h-12 shrink-0 items-center border-b px-4">
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="flex-1 p-3 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
