import type { Metadata } from 'next';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import db from '@/lib/db';
import { videos } from '@/lib/db/schema';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const video = await db.query.videos.findFirst({ where: eq(videos.id, id), with: { host: true } });
  if (!video || !video.isPublished) return {};
  const subdomain = process.env.CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN;
  const thumb = video.thumbnailUrl ??
    (subdomain && video.cloudflareVideoId
      ? `https://customer-${subdomain}.cloudflarestream.com/${video.cloudflareVideoId}/thumbnails/thumbnail.jpg`
      : null);
  return {
    title: video.title,
    description: `Video by ${video.host.name} · ${video.totalViews.toLocaleString()} views`,
    openGraph: {
      title: video.title,
      description: `Watch on Live`,
      images: thumb ? [thumb] : [],
    },
    twitter: { card: 'summary_large_image', title: video.title },
  };
}
import { Badge } from '@/components/ui/badge';
import { VideoPlayer } from './video-player';
import { getVideoProgress } from './progress-actions';
import { BreadcrumbLabel } from '@/components/breadcrumb-labels';

export default async function VideoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [video, startTime] = await Promise.all([
    db.query.videos.findFirst({ where: eq(videos.id, id), with: { host: true } }),
    getVideoProgress(id),
  ]);

  if (!video || !video.isPublished) notFound();

  const subdomain = process.env.CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN!;
  const embedUrl = `https://customer-${subdomain}.cloudflarestream.com/${video.cloudflareVideoId}/iframe`;

  return (
    <div className="w-full p-4 space-y-4">
      <BreadcrumbLabel id={id} name={video.title} />
      {/* Player */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
        {video.status === 'ready' && video.cloudflareVideoId ? (
          <VideoPlayer
            videoId={id}
            embedUrl={embedUrl}
            startTime={startTime}
            duration={video.duration ?? null}
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

      {/* Chapters */}
      {video.chapters && video.chapters.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Chapters</h2>
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
            {video.chapters.map((ch, i) => (
              <a
                key={i}
                href={`${embedUrl}?t=${ch.time}`}
                className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                <span className="font-mono text-xs text-muted-foreground w-12 shrink-0">
                  {formatDuration(ch.time)}
                </span>
                <span className="truncate">{ch.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}
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
