import { Skeleton } from '@/components/ui/skeleton';

export default function PostLoading() {
  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-8 w-4/5" />
      <Skeleton className="h-4 w-32" />
      <div className="space-y-2 pt-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}
