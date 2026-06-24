import { Skeleton } from '@/components/ui/skeleton';

export default function RoomLoading() {
  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-1 flex-col min-w-0">
        <div className="flex h-12 shrink-0 items-center gap-3 border-b px-4">
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="flex-1 rounded-none" />
        <div className="h-12 shrink-0 border-t" />
      </div>
      <div className="flex w-64 shrink-0 flex-col border-l">
        <div className="flex h-12 items-center border-b px-4">
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex-1 p-3 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="size-7 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
