import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import db from '@/lib/db';
import { videos, users } from '@/lib/db/schema';
import { Badge } from '@/components/ui/badge';

export default async function VideoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const video = await db.query.videos.findFirst({
    where: eq(videos.id, id),
    with: { host: true },
  });

  if (!video || !video.isPublished) notFound();

  const subdomain = process.env.CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN!;
  const embedUrl = `https://customer-${subdomain}.cloudflarestream.com/${video.cloudflareVideoId}/iframe`;

  return (
    <div className="w-full p-4 space-y-4">
      {/* Player */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
        {video.status === 'ready' && video.cloudflareVideoId ? (
          <iframe
            src={embedUrl}
            className="h-full w-full"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="flex h-full items-center justify-center text-white/60">
            {video.status === 'error' ? 'Processing failed' : 'Video is processing…'}
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">{video.title}</h1>
          {!video.isPublished && <Badge variant="secondary">Draft</Badge>}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{video.host.name}</span>
          <span>·</span>
          <span>{video.totalViews.toLocaleString()} views</span>
          {video.duration && (
            <>
              <span>·</span>
              <span>{formatDuration(video.duration)}</span>
            </>
          )}
        </div>
        {video.description && (
          <p className="pt-2 text-sm text-muted-foreground">{video.description}</p>
        )}
      </div>
    </div>
  );
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
