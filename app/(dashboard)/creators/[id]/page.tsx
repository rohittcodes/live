import type { Metadata } from 'next';
import Link from 'next/link';
import { eq, desc, isNotNull, and, or, count } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import db from '@/lib/db';
import { users, streams, videos, follows } from '@/lib/db/schema';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const creator = await db.query.users.findFirst({
    where: or(eq(users.username, id), eq(users.id, id)),
  });
  if (!creator) return {};
  return {
    title: creator.name,
    description: `${creator.name}'s streams and videos on Live`,
    openGraph: {
      title: creator.name,
      description: `${creator.name} on Live`,
      images: creator.imageUrl ? [creator.imageUrl] : [],
    },
    twitter: { card: 'summary_large_image', title: creator.name },
  };
}
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BreadcrumbLabel } from '@/components/breadcrumb-labels';
import { FollowButton } from '@/components/follow-button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function CreatorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId: viewerId } = await auth();

  const creator = await db.query.users.findFirst({
    where: or(eq(users.username, id), eq(users.id, id)),
  });
  if (!creator) notFound();

  const [creatorStreams, creatorVideos, followerCountResult, isFollowingResult] = await Promise.all([
    db.query.streams.findMany({
      where: and(eq(streams.hostId, creator.id), isNotNull(streams.recordingUrl)),
      orderBy: desc(streams.createdAt),
      limit: 8,
    }),
    db.query.videos.findMany({
      where: eq(videos.hostId, creator.id),
      orderBy: desc(videos.createdAt),
      limit: 8,
    }),
    db.select({ total: count() }).from(follows).where(eq(follows.followingId, creator.id)),
    viewerId && viewerId !== creator.id
      ? db.query.follows.findFirst({
          where: and(eq(follows.followerId, viewerId), eq(follows.followingId, creator.id)),
        })
      : Promise.resolve(null),
  ]);

  const followerCount = followerCountResult[0]?.total ?? 0;
  const isFollowing = !!isFollowingResult;

  const subdomain = process.env.CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN;
  const initials = creator.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  const publishedVideos = creatorVideos.filter((v) => v.isPublished);

  return (
    <div className="w-full p-4 space-y-8">
      <BreadcrumbLabel id={id} name={creator.username ?? creator.name} />
      {/* Profile header */}
      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          {creator.imageUrl && <AvatarImage src={creator.imageUrl} alt={creator.name} />}
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold">{creator.name}</h1>
          {creator.username && <p className="text-sm text-muted-foreground">@{creator.username}</p>}
          <div className="flex gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">{creatorStreams.length} streams</Badge>
            <Badge variant="outline" className="text-xs">{publishedVideos.length} videos</Badge>
            <Badge variant="outline" className="text-xs">{followerCount.toLocaleString()} followers</Badge>
          </div>
        </div>
        {viewerId && viewerId !== creator.id && (
          <FollowButton
            followingId={creator.id}
            initialIsFollowing={isFollowing}
            initialCount={followerCount}
          />
        )}
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
                  <Card className="cursor-pointer transition-all duration-300">
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
                <Card className="cursor-pointer transition-all duration-300">
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
