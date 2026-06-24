import { desc, sum, count, gte, sql } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import db from '@/lib/db';
import { streams, videos, streamViews, videoViews, users } from '@/lib/db/schema';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AnalyticsCharts, type DailyPoint, type ContentItem } from './charts';
import { RadioIcon, VideoIcon, EyeIcon, UsersIcon } from 'lucide-react';

export default async function AnalyticsPage() {
  await requireAdmin();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [svByDay, vvByDay, topStreams, topVideos, streamViewCount, newUsersCount] = await Promise.all([
    db.select({
      day: sql<string>`to_char(${streamViews.joinedAt}, 'YYYY-MM-DD')`,
      views: count(),
    })
    .from(streamViews)
    .where(gte(streamViews.joinedAt, thirtyDaysAgo))
    .groupBy(sql`to_char(${streamViews.joinedAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${streamViews.joinedAt}, 'YYYY-MM-DD')`),

    db.select({
      day: sql<string>`to_char(${videoViews.createdAt}, 'YYYY-MM-DD')`,
      views: count(),
    })
    .from(videoViews)
    .where(gte(videoViews.createdAt, thirtyDaysAgo))
    .groupBy(sql`to_char(${videoViews.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${videoViews.createdAt}, 'YYYY-MM-DD')`),

    db.query.streams.findMany({
      with: { host: true },
      orderBy: desc(streams.totalViews),
      limit: 10,
    }),

    db.query.videos.findMany({
      with: { host: true },
      orderBy: desc(videos.totalViews),
      limit: 10,
    }),

    db.select({ total: count() }).from(streamViews).where(gte(streamViews.joinedAt, thirtyDaysAgo)),

    db.select({ total: count() }).from(users).where(gte(users.createdAt, thirtyDaysAgo)),
  ]);

  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().slice(0, 10);
  });
  const svMap = Object.fromEntries(svByDay.map((r) => [r.day, r.views]));
  const vvMap = Object.fromEntries(vvByDay.map((r) => [r.day, r.views]));
  const dailyData: DailyPoint[] = days.map((date) => ({
    date,
    streams: svMap[date] ?? 0,
    videos: vvMap[date] ?? 0,
  }));

  const streamItems: ContentItem[] = topStreams.map((s) => ({
    title: s.title,
    views: s.totalViews,
    peak: s.peakConcurrentViewers,
    host: s.host?.name,
  }));
  const videoItems: ContentItem[] = topVideos.map((v) => ({
    title: v.title,
    views: v.totalViews,
    host: v.host?.name,
  }));

  const stats = [
    { label: 'Stream Views (30d)', value: streamViewCount[0].total, icon: EyeIcon },
    { label: 'New Users (30d)',    value: newUsersCount[0].total,   icon: UsersIcon },
    { label: 'Total Streams',      value: topStreams.length,         icon: RadioIcon },
    { label: 'Total Videos',       value: topVideos.length,          icon: VideoIcon },
  ];

  return (
    <div className="w-full p-4 space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="px-4 pt-4 pb-1">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-medium uppercase tracking-wide">{s.label}</CardDescription>
                <s.icon className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <span className="text-3xl font-bold tabular-nums">{s.value.toLocaleString()}</span>
            </CardContent>
          </Card>
        ))}
      </div>
      <AnalyticsCharts daily={dailyData} streams={streamItems} videos={videoItems} />
    </div>
  );
}
