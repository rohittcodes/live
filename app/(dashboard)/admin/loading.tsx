import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLoading() {
  return (
    <div className="w-full p-4 space-y-4 max-w-2xl">
      <Skeleton className="h-6 w-32" />
      <div className="rounded-xl border overflow-hidden">
        <div className="p-3 border-b">
          <Skeleton className="h-4 w-24" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3 border-b last:border-0">
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <Skeleton className="h-7 w-20 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
