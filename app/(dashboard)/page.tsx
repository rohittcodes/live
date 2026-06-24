import Link from 'next/link';
import { desc, eq, gt, and, inArray } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import db from '@/lib/db';
import { streams, videos, audioRooms, communityPosts, follows } from '@/lib/db/schema';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { RadioIcon, VideoIcon, MicIcon, MessageSquareIcon } from 'lucide-react';

export default async function HomePage() {
  const subdomain = process.env.CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN;
  const { userId } = await auth();

  const [liveStreams, upcomingStreams, activeRooms, upcomingRooms, recentVideos, recentPosts, followingRows] = await Promise.all([
    db.query.streams.findMany({
      where: eq(streams.isLive, true),
      with: { host: true },
      limit: 4,
    }),
    db.query.streams.findMany({
      where: and(eq(streams.isLive, false), gt(streams.scheduledAt, new Date())),
      with: { host: true },
      orderBy: streams.scheduledAt,
      limit: 4,
    }),
    db.query.audioRooms.findMany({
      where: eq(audioRooms.status, 'active'),
      with: { host: true },
      limit: 4,
    }),
    db.query.audioRooms.findMany({
      where: eq(audioRooms.status, 'scheduled'),
      with: { host: true },
      orderBy: audioRooms.scheduledAt,
      limit: 4,
    }),
    db.query.videos.findMany({
      where: eq(videos.isPublished, true),
      with: { host: true },
      orderBy: desc(videos.createdAt),
      limit: 8,
    }),
    db.query.communityPosts.findMany({
      where: eq(communityPosts.isPublished, true),
      with: { author: true },
      orderBy: desc(communityPosts.publishedAt),
      limit: 3,
    }),
    userId
      ? db.query.follows.findMany({ where: eq(follows.followerId, userId) })
      : Promise.resolve([]),
  ]);

  const followingIds = followingRows.map((f) => f.followingId);
  const followingLive = followingIds.length > 0
    ? await db.query.streams.findMany({
        where: and(eq(streams.isLive, true), inArray(streams.hostId, followingIds)),
        with: { host: true },
        limit: 4,
      })
    : [];

  const liveNow = [
    ...liveStreams.map((s) => ({ type: 'stream' as const, item: s })),
    ...activeRooms.map((r) => ({ type: 'room' as const, item: r })),
  ];

  return (
    <div className="w-full p-4 space-y-10">
      {/* Hero */}
      <section className="rounded-xl border bg-gradient-to-br from-muted/60 to-muted/20 px-6 py-8 space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Live</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          Watch live streams, join audio rooms, catch up on videos, and connect with the community.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/videos" className="text-xs text-primary underline underline-offset-4">Browse videos</Link>
          <Link href="/rooms" className="text-xs text-primary underline underline-offset-4">Audio rooms</Link>
          <Link href="/community" className="text-xs text-primary underline underline-offset-4">Community</Link>
          <Link href="/creators" className="text-xs text-primary underline underline-offset-4">Creators</Link>
        </div>
      </section>

      {/* Following — Live */}
      {followingLive.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Following — Live Now</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {followingLive.map((s) => (
              <Link key={s.id} href={`/stream/${s.id}`}>
                <Card className="cursor-pointer transition-all duration-300">
                  <div className="aspect-video bg-muted relative overflow-hidden rounded-t-xl">
                    {s.thumbnailUrl
                      ? <img src={s.thumbnailUrl} alt={s.title} className="h-full w-full object-cover" />
                      : <div className="flex h-full items-center justify-center text-muted-foreground text-sm">Live</div>
                    }
                    <Badge variant="destructive" className="absolute top-2 right-2 text-[10px] animate-pulse">LIVE</Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-1 text-sm">{s.title}</CardTitle>
                    <CardDescription className="text-xs">{s.host.name}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Live Now */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
          Live Now
        </h2>
        {liveNow.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon"><RadioIcon /></EmptyMedia>
              <EmptyTitle>Nothing live right now</EmptyTitle>
              <EmptyDescription>Check back later or browse videos in the meantime.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {liveNow.map(({ type, item }) => (
              <Link key={item.id} href={type === 'stream' ? `/stream/${item.id}` : `/rooms/${item.id}`}>
                <Card className="cursor-pointer transition-all duration-300">
                  {type === 'stream' && (item as typeof liveStreams[number]).thumbnailUrl ? (
                    <div className="aspect-video bg-muted relative overflow-hidden rounded-t-xl">
                      <img
                        src={(item as typeof liveStreams[number]).thumbnailUrl!}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                      <Badge variant="destructive" className="absolute top-2 left-2 animate-pulse text-xs">LIVE</Badge>
                    </div>
                  ) : (
                    <div className="aspect-video bg-muted relative overflow-hidden rounded-t-xl flex items-center justify-center">
                      {type === 'room'
                        ? <MicIcon className="size-8 text-muted-foreground/40" />
                        : <VideoIcon className="size-8 text-muted-foreground/40" />
                      }
                      <Badge variant="destructive" className="absolute top-2 left-2 animate-pulse text-xs">LIVE</Badge>
                      {type === 'room' && (
                        <Badge variant="secondary" className="absolute top-2 right-2 text-xs">Audio</Badge>
                      )}
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="line-clamp-1 text-sm">{item.title}</CardTitle>
                    <CardDescription className="text-xs">{item.host.name}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming Streams */}
      {upcomingStreams.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Upcoming Streams</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {upcomingStreams.map((s) => (
              <Link key={s.id} href={`/stream/${s.id}`}>
                <Card className="cursor-pointer transition-all duration-300">
                  <div className="aspect-video bg-muted relative overflow-hidden rounded-t-xl">
                    {s.thumbnailUrl ? (
                      <img src={s.thumbnailUrl} alt={s.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <RadioIcon className="size-8 text-muted-foreground/40" />
                      </div>
                    )}
                    <Badge variant="secondary" className="absolute top-2 left-2 text-xs">Scheduled</Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-1 text-sm">{s.title}</CardTitle>
                    <CardDescription className="text-xs">
                      {s.host.name}
                      {s.scheduledAt && <> · {new Date(s.scheduledAt).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</>}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Audio Rooms */}
      {upcomingRooms.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Upcoming Audio Rooms</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {upcomingRooms.map((room) => (
              <Link key={room.id} href={`/rooms/${room.id}`}>
                <Card className="cursor-pointer transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="line-clamp-1 text-sm">{room.title}</CardTitle>
                      <Badge variant="secondary" className="shrink-0 text-xs">Audio</Badge>
                    </div>
                    <CardDescription className="text-xs">
                      {room.host.name}
                      {room.scheduledAt && <> · {new Date(room.scheduledAt).toLocaleDateString()}</>}
                    </CardDescription>
                  </CardHeader>
                  {room.description && (
                    <CardContent>
                      <p className="text-xs text-muted-foreground line-clamp-2">{room.description}</p>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Videos */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Videos</h2>
          <Link href="/videos" className="text-xs text-muted-foreground hover:text-foreground">See all</Link>
        </div>
        {recentVideos.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon"><VideoIcon /></EmptyMedia>
              <EmptyTitle>No videos yet</EmptyTitle>
              <EmptyDescription>Published videos will appear here.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recentVideos.map((video) => {
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
                          {video.status !== 'ready' ? 'Processing…' : 'No thumbnail'}
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
      </section>

      {/* Community */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Community</h2>
          <Link href="/community" className="text-xs text-muted-foreground hover:text-foreground">See all</Link>
        </div>
        {recentPosts.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon"><MessageSquareIcon /></EmptyMedia>
              <EmptyTitle>No posts yet</EmptyTitle>
              <EmptyDescription>Community posts will appear here.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentPosts.map((post) => (
              <Link key={post.id} href={`/community/${post.id}`}>
                <Card className="cursor-pointer transition-all duration-300 h-full">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs capitalize">{post.type}</Badge>
                    </div>
                    <CardTitle className="line-clamp-2 text-sm">{post.title}</CardTitle>
                    <CardDescription className="text-xs">{post.author.name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground line-clamp-3">{post.content}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
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
