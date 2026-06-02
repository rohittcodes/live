'use client';

import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export type DailyPoint = { date: string; streams: number; videos: number };
export type ContentItem = { title: string; views: number; peak?: number };

const trendConfig = {
  streams: { label: 'Stream Views', color: 'var(--chart-1)' },
  videos: { label: 'Video Views', color: 'var(--chart-2)' },
} satisfies ChartConfig;

const contentConfig = {
  views: { label: 'Views', color: 'var(--chart-1)' },
  peak: { label: 'Peak', color: 'var(--chart-4)' },
} satisfies ChartConfig;

export function AnalyticsCharts({ daily, streams, videos }: { daily: DailyPoint[]; streams: ContentItem[]; videos: ContentItem[] }) {
  return (
    <div className="space-y-4">
      {/* 30-day trend */}
      <Card>
        <CardHeader className="px-4 pt-4 pb-0">
          <CardTitle className="text-sm font-semibold">Views — Last 30 Days</CardTitle>
          <CardDescription className="text-xs">Daily stream views vs video views</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-2">
          <ChartContainer config={trendConfig} className="h-[240px] w-full">
            <AreaChart data={daily} margin={{ left: -8, right: 8 }}>
              <defs>
                <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8}
                tickFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                interval={4} />
              <YAxis tickLine={false} axisLine={false} width={32} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="streams" stroke="var(--chart-1)" strokeWidth={2} fill="url(#gS)" />
              <Area type="monotone" dataKey="videos" stroke="var(--chart-2)" strokeWidth={2} fill="url(#gV)" />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Top content */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="px-4 pt-4 pb-0">
            <CardTitle className="text-sm font-semibold">Top Streams</CardTitle>
            <CardDescription className="text-xs">By total views</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-2">
            {streams.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No streams yet</p>
            ) : (
              <ChartContainer config={contentConfig} className="h-[220px] w-full">
                <BarChart data={streams} layout="vertical" margin={{ left: 0, right: 8 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis type="number" tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="title" tickLine={false} axisLine={false} width={90}
                    tickFormatter={(v: string) => v.length > 14 ? v.slice(0, 14) + '…' : v} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="views" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="peak" fill="var(--chart-4)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-4 pt-4 pb-0">
            <CardTitle className="text-sm font-semibold">Top Videos</CardTitle>
            <CardDescription className="text-xs">By total views</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-2">
            {videos.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No videos yet</p>
            ) : (
              <ChartContainer config={contentConfig} className="h-[220px] w-full">
                <BarChart data={videos} layout="vertical" margin={{ left: 0, right: 8 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis type="number" tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="title" tickLine={false} axisLine={false} width={90}
                    tickFormatter={(v: string) => v.length > 14 ? v.slice(0, 14) + '…' : v} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="views" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
