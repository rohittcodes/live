import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="w-full p-4 space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-5 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-8 w-2/3" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border p-5 space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}
