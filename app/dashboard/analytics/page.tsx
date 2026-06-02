import { eq, desc, sum, count, and, gte, sql } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import db from '@/lib/db';
import { streams, videos, streamViews, videoViews } from '@/lib/db/schema';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AnalyticsCharts, type DailyPoint, type ContentItem } from './charts';

export default async function AnalyticsPage() {
  const user = await requireAdmin();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [svByDay, vvByDay, topStreams, topVideos] = await Promise.all([
    db.select({
      day: sql<string>`to_char(${streamViews.joinedAt}, 'YYYY-MM-DD')`,
      views: count(),
    })
    .from(streamViews)
    .innerJoin(streams, eq(streams.id, streamViews.streamId))
    .where(and(eq(streams.hostId, user.id), gte(streamViews.joinedAt, thirtyDaysAgo)))
    .groupBy(sql`to_char(${streamViews.joinedAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${streamViews.joinedAt}, 'YYYY-MM-DD')`),

    db.select({
      day: sql<string>`to_char(${videoViews.createdAt}, 'YYYY-MM-DD')`,
      views: count(),
    })
    .from(videoViews)
    .innerJoin(videos, eq(videos.id, videoViews.videoId))
    .where(and(eq(videos.hostId, user.id), gte(videoViews.createdAt, thirtyDaysAgo)))
    .groupBy(sql`to_char(${videoViews.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${videoViews.createdAt}, 'YYYY-MM-DD')`),

    db.query.streams.findMany({
      where: eq(streams.hostId, user.id),
      orderBy: desc(streams.totalViews),
      limit: 10,
    }),

    db.query.videos.findMany({
      where: eq(videos.hostId, user.id),
      orderBy: desc(videos.totalViews),
      limit: 10,
    }),
  ]);

  // Fill 30-day array
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

  const streamItems: ContentItem[] = topStreams.map((s) => ({ title: s.title, views: s.totalViews, peak: s.peakConcurrentViewers }));
  const videoItems: ContentItem[] = topVideos.map((v) => ({ title: v.title, views: v.totalViews }));

  return (
    <div className="w-full p-4 space-y-4">
      <AnalyticsCharts daily={dailyData} streams={streamItems} videos={videoItems} />
    </div>
  );
}
