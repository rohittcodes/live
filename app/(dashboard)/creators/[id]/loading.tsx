import { Skeleton } from '@/components/ui/skeleton';

function MiniCardSkeleton() {
  return (
    <div className="rounded-xl border overflow-hidden">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

export default function CreatorProfileLoading() {
  return (
    <div className="w-full p-4 space-y-8">
      {/* Avatar + info */}
      <div className="flex items-center gap-4">
        <Skeleton className="size-16 rounded-full shrink-0" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-28" />
          <div className="flex gap-2 mt-1">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      </div>
      <section className="space-y-3">
        <Skeleton className="h-5 w-20" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <MiniCardSkeleton key={i} />)}
        </div>
      </section>
    </div>
  );
}
