import { Skeleton } from '@/components/ui/skeleton';

export default function RecapLoading() {
  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-6">
      <Skeleton className="h-8 w-28" />
      <div className="space-y-1">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-4 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-3 space-y-2 text-center">
            <Skeleton className="h-8 w-8 mx-auto rounded" />
            <Skeleton className="h-4 w-6 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
