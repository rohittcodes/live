import type { Metadata } from 'next';
import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';

export const metadata: Metadata = {
  title: 'Videos',
  description: 'Browse all published videos.',
};
import db from '@/lib/db';
import { videos } from '@/lib/db/schema';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { VideoIcon } from 'lucide-react';

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default async function VideosPage() {
  const allVideos = await db.query.videos.findMany({
    where: eq(videos.isPublished, true),
    with: { host: true },
    orderBy: desc(videos.createdAt),
  });

  const subdomain = process.env.CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN;

  return (
    <div className="w-full p-4 space-y-6">
      {allVideos.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon"><VideoIcon /></EmptyMedia>
            <EmptyTitle>No videos yet</EmptyTitle>
            <EmptyDescription>Published videos will appear here.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {allVideos.map((video) => {
            const thumb = subdomain && video.cloudflareVideoId
              ? `https://customer-${subdomain}.cloudflarestream.com/${video.cloudflareVideoId}/thumbnails/thumbnail.jpg`
              : null;

            return (
              <Link key={video.id} href={`/videos/${video.id}`}>
                <Card className="cursor-pointer transition-all duration-300">
                  <div className="aspect-video bg-muted relative overflow-hidden rounded-t-xl">
                    {thumb ? (
                      <img src={thumb} alt={video.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                        No thumbnail
                      </div>
                    )}
                    {video.duration && (
                      <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1 py-0.5 text-xs text-white">
                        {formatDuration(video.duration)}
                      </span>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-1 text-sm">{video.title}</CardTitle>
                    <CardDescription className="text-xs">
                      {video.host.name} · {video.totalViews.toLocaleString()} views
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
