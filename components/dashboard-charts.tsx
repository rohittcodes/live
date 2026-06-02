'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

const trendConfig = {
  streams: { label: 'Stream Views', color: 'var(--chart-1)' },
  videos: { label: 'Video Views', color: 'var(--chart-2)' },
} satisfies ChartConfig;

const streamConfig = {
  views: { label: 'Total Views', color: 'var(--chart-1)' },
  peak: { label: 'Peak Viewers', color: 'var(--chart-4)' },
} satisfies ChartConfig;

export type TrendPoint = { date: string; streams: number; videos: number };
export type StreamBar = { title: string; views: number; peak: number };

export function ViewsTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ChartContainer config={trendConfig} className="h-[220px] w-full">
      <AreaChart data={data} margin={{ left: -8, right: 8 }}>
        <defs>
          <linearGradient id="gStreams" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gVideos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(v) => new Date(v).toLocaleDateString('en', { weekday: 'short' })}
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={4} width={32} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="streams"
          stroke="var(--chart-1)"
          strokeWidth={2}
          fill="url(#gStreams)"
        />
        <Area
          type="monotone"
          dataKey="videos"
          stroke="var(--chart-2)"
          strokeWidth={2}
          fill="url(#gVideos)"
        />
      </AreaChart>
    </ChartContainer>
  );
}

export function TopStreamsChart({ data }: { data: StreamBar[] }) {
  return (
    <ChartContainer config={streamConfig} className="h-[220px] w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 8 }}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis type="number" tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="title"
          tickLine={false}
          axisLine={false}
          width={80}
          tickFormatter={(v: string) => (v.length > 12 ? v.slice(0, 12) + '…' : v)}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="views" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
        <Bar dataKey="peak" fill="var(--chart-4)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
