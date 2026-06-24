import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { eq, desc, count, sum, and, gte, sql } from 'drizzle-orm';
import Link from 'next/link';
import {
  EyeIcon,
  VideoIcon,
  RadioIcon,
  MicIcon,
  TrendingUpIcon,
  UsersIcon,
  PlusCircleIcon,
  ArrowUpRightIcon,
  ClockIcon,
} from 'lucide-react';
import db from '@/lib/db';
import { streams, videos, audioRooms, streamViews, videoViews } from '@/lib/db/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty';
import { ViewsTrendChart, TopStreamsChart, type TrendPoint, type StreamBar } from '@/components/dashboard-charts';

function formatDuration(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function formatNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    myStreams,
    myVideos,
    myRooms,
    streamViewStats,
    videoViewStats,
    svByDay,
    vvByDay,
  ] = await Promise.all([
    // All streams for this user
    db.query.streams.findMany({
      where: eq(streams.hostId, userId),
      orderBy: desc(streams.createdAt),
      limit: 5,
    }),
    // All videos for this user
    db.query.videos.findMany({
      where: eq(videos.hostId, userId),
      orderBy: desc(videos.createdAt),
      limit: 6,
    }),
    // Audio rooms count
    db
      .select({ total: count() })
      .from(audioRooms)
      .where(eq(audioRooms.hostId, userId)),
    // Total stream views
    db
      .select({ total: sum(streams.totalViews) })
      .from(streams)
      .where(eq(streams.hostId, userId)),
    // Total video views
    db
      .select({ total: sum(videos.totalViews) })
      .from(videos)
      .where(eq(videos.hostId, userId)),
    // Stream views per day (last 7 days)
    db
      .select({
        day: sql<string>`to_char(${streamViews.joinedAt}, 'YYYY-MM-DD')`,
        views: count(),
      })
      .from(streamViews)
      .innerJoin(streams, eq(streams.id, streamViews.streamId))
      .where(and(eq(streams.hostId, userId), gte(streamViews.joinedAt, sevenDaysAgo)))
      .groupBy(sql`to_char(${streamViews.joinedAt}, 'YYYY-MM-DD')`),
    // Video views per day (last 7 days)
    db
      .select({
        day: sql<string>`to_char(${videoViews.createdAt}, 'YYYY-MM-DD')`,
        views: count(),
      })
      .from(videoViews)
      .innerJoin(videos, eq(videos.id, videoViews.videoId))
      .where(and(eq(videos.hostId, userId), gte(videoViews.createdAt, sevenDaysAgo)))
      .groupBy(sql`to_char(${videoViews.createdAt}, 'YYYY-MM-DD')`),
  ]);

  // Build 7-day trend array
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  const svMap = Object.fromEntries(svByDay.map((r) => [r.day, r.views]));
  const vvMap = Object.fromEntries(vvByDay.map((r) => [r.day, r.views]));
  const trendData: TrendPoint[] = days.map((date) => ({
    date,
    streams: svMap[date] ?? 0,
    videos: vvMap[date] ?? 0,
  }));

  // Top streams bar data
  const topStreamsData: StreamBar[] = myStreams
    .slice(0, 5)
    .map((s) => ({ title: s.title, views: s.totalViews, peak: s.peakConcurrentViewers }));

  const totalStreamViews = Number(streamViewStats[0]?.total ?? 0);
  const totalVideoViews = Number(videoViewStats[0]?.total ?? 0);
  const totalRooms = myRooms[0]?.total ?? 0;
  const liveNow = myStreams.filter((s) => s.isLive).length;

  const stats = [
    {
      label: 'Stream Views',
      value: formatNum(totalStreamViews),
      icon: EyeIcon,
      sub: `${myStreams.length} stream${myStreams.length !== 1 ? 's' : ''} total`,
      color: 'text-chart-1',
    },
    {
      label: 'Video Views',
      value: formatNum(totalVideoViews),
      icon: VideoIcon,
      sub: `${myVideos.length} video${myVideos.length !== 1 ? 's' : ''} uploaded`,
      color: 'text-chart-2',
    },
    {
      label: 'Audio Rooms',
      value: String(totalRooms),
      icon: MicIcon,
      sub: 'Rooms hosted',
      color: 'text-chart-4',
    },
    {
      label: 'Live Now',
      value: String(liveNow),
      icon: RadioIcon,
      sub: liveNow > 0 ? 'Currently streaming' : 'Not live',
      color: 'text-destructive',
      live: liveNow > 0,
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="px-4 pt-4 pb-1">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-medium uppercase tracking-wide">
                  {s.label}
                </CardDescription>
                <s.icon className={`size-4 ${s.color}`} />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold tabular-nums">{s.value}</span>
                {s.live && (
                  <Badge variant="destructive" className="mb-0.5 animate-pulse text-[10px]">
                    LIVE
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader className="px-4 pt-4 pb-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Views — Last 7 Days</CardTitle>
                <CardDescription className="text-xs">Stream views vs video views</CardDescription>
              </div>
              <TrendingUpIcon className="size-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-2">
            <ViewsTrendChart data={trendData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-4 pt-4 pb-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Top Streams</CardTitle>
                <CardDescription className="text-xs">Views & peak concurrent viewers</CardDescription>
              </div>
              <UsersIcon className="size-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-2">
            {topStreamsData.length === 0 ? (
              <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
                No streams yet
              </div>
            ) : (
              <TopStreamsChart data={topStreamsData} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Content tables */}
      <div className="grid gap-3 lg:grid-cols-2">
        {/* Recent streams */}
        <Card>
          <CardHeader className="px-4 py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Recent Streams</CardTitle>
              <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                <Link href="/dashboard/streams">
                  View all <ArrowUpRightIcon className="ml-1 size-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {myStreams.length === 0 ? (
              <Empty className="m-4 border">
                <EmptyHeader>
                  <EmptyMedia variant="icon"><RadioIcon /></EmptyMedia>
                  <EmptyTitle>No streams yet</EmptyTitle>
                  <EmptyDescription>Start your first live stream to see it here.</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button size="sm" asChild>
                    <Link href="/stream/new">Go Live</Link>
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">Peak</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myStreams.map((stream) => (
                    <TableRow key={stream.id}>
                      <TableCell className="max-w-[160px] truncate font-medium">
                        <Link href={`/stream/${stream.id}`} className="hover:text-primary">
                          {stream.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {formatNum(stream.totalViews)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {formatNum(stream.peakConcurrentViewers)}
                      </TableCell>
                      <TableCell className="text-right">
                        {stream.isLive ? (
                          <Badge variant="destructive" className="animate-pulse text-[10px]">LIVE</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Ended</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent videos */}
        <Card>
          <CardHeader className="px-4 py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Recent Videos</CardTitle>
              <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                <Link href="/dashboard/videos">
                  View all <ArrowUpRightIcon className="ml-1 size-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {myVideos.length === 0 ? (
              <Empty className="m-4 border">
                <EmptyHeader>
                  <EmptyMedia variant="icon"><VideoIcon /></EmptyMedia>
                  <EmptyTitle>No videos yet</EmptyTitle>
                  <EmptyDescription>Upload your first video to see stats here.</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button size="sm" asChild>
                    <Link href="/videos/upload">Upload Video</Link>
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">Duration</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myVideos.map((video) => (
                    <TableRow key={video.id}>
                      <TableCell className="max-w-[160px] truncate font-medium">
                        <Link href={`/videos/${video.id}`} className="hover:text-primary">
                          {video.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {formatNum(video.totalViews)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {video.duration ? (
                          <span className="flex items-center justify-end gap-1">
                            <ClockIcon className="size-3" />
                            {formatDuration(video.duration)}
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {video.status === 'ready' ? (
                          video.isPublished ? (
                            <Badge variant="default" className="text-[10px]">Published</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">Draft</Badge>
                          )
                        ) : video.status === 'error' ? (
                          <Badge variant="destructive" className="text-[10px]">Error</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">Processing</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
