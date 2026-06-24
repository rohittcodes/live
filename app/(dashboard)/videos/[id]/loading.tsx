import { Skeleton } from '@/components/ui/skeleton';

export default function VideoLoading() {
  return (
    <div className="w-full p-4 space-y-4">
      <Skeleton className="aspect-video w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
    </div>
  );
}
