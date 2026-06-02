import Link from 'next/link';
import { eq, desc, isNotNull, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import db from '@/lib/db';
import { users, streams, videos } from '@/lib/db/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function CreatorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const creator = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!creator) notFound();

  const [creatorStreams, creatorVideos] = await Promise.all([
    db.query.streams.findMany({
      where: and(eq(streams.hostId, id), isNotNull(streams.recordingUrl)),
      orderBy: desc(streams.createdAt),
      limit: 8,
    }),
    db.query.videos.findMany({
      where: eq(videos.hostId, id),
      orderBy: desc(videos.createdAt),
      limit: 8,
    }),
  ]);

  const subdomain = process.env.CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN;
  const initials = creator.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  const publishedVideos = creatorVideos.filter((v) => v.isPublished);

  return (
    <div className="w-full p-4 space-y-8">
      {/* Profile header */}
      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          {creator.imageUrl && <AvatarImage src={creator.imageUrl} alt={creator.name} />}
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-bold">{creator.name}</h1>
          {creator.username && <p className="text-sm text-muted-foreground">@{creator.username}</p>}
          <div className="flex gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">{creatorStreams.length} streams</Badge>
            <Badge variant="outline" className="text-xs">{publishedVideos.length} videos</Badge>
          </div>
        </div>
      </div>

      {/* Videos */}
      {publishedVideos.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold">Videos</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {publishedVideos.map((video) => {
              const thumb = subdomain && video.cloudflareVideoId
                ? `https://customer-${subdomain}.cloudflarestream.com/${video.cloudflareVideoId}/thumbnails/thumbnail.jpg`
                : null;
              return (
                <Link key={video.id} href={`/videos/${video.id}`}>
                  <Card className="hover:ring-2 hover:ring-primary transition-all cursor-pointer">
                    <div className="aspect-video bg-muted relative overflow-hidden rounded-t-xl">
                      {thumb
                        ? <img src={thumb} alt={video.title} className="h-full w-full object-cover" />
                        : <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No thumbnail</div>
                      }
                    </div>
                    <CardHeader>
                      <CardTitle className="line-clamp-1 text-sm">{video.title}</CardTitle>
                      <CardDescription className="text-xs">{video.totalViews.toLocaleString()} views</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Recorded streams */}
      {creatorStreams.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold">Past Streams</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {creatorStreams.map((stream) => (
              <Link key={stream.id} href={stream.recordingUrl!}>
                <Card className="hover:ring-2 hover:ring-primary transition-all cursor-pointer">
                  <div className="aspect-video bg-muted relative overflow-hidden rounded-t-xl">
                    {stream.thumbnailUrl
                      ? <img src={stream.thumbnailUrl} alt={stream.title} className="h-full w-full object-cover" />
                      : <div className="flex h-full items-center justify-center text-muted-foreground text-sm">Recording</div>
                    }
                    <Badge variant="secondary" className="absolute top-2 right-2 text-xs">REC</Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-1 text-sm">{stream.title}</CardTitle>
                    <CardDescription className="text-xs">{stream.peakConcurrentViewers} peak viewers</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
