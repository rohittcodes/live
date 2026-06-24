import { Skeleton } from '@/components/ui/skeleton';

export default function CreatorsLoading() {
  return (
    <div className="w-full p-4 space-y-4">
      <Skeleton className="h-6 w-24" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-5 flex items-center gap-4">
            <Skeleton className="size-12 rounded-full shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
