import { NextRequest, NextResponse } from 'next/server';
import { and, eq, isNull } from 'drizzle-orm';
import db from '@/lib/db';
import { streamViews, streams } from '@/lib/db/schema';
import { overlayLimiter, getIp } from '@/lib/ratelimit';

export const revalidate = 5;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ streamId: string }> },
) {
  if (overlayLimiter) {
    const { success } = await overlayLimiter.limit(getIp(req.headers));
    if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { streamId } = await params;

  const [stream, activeViews] = await Promise.all([
    db.query.streams.findFirst({ where: eq(streams.id, streamId) }),
    db.query.streamViews.findMany({
      where: and(eq(streamViews.streamId, streamId), isNull(streamViews.leftAt)),
    }),
  ]);

  if (!stream) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Members-only stream metadata is not exposed publicly
  if (stream.isMembersOnly) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(
    { viewerCount: activeViews.length, isLive: stream.isLive, title: stream.title, category: stream.category },
    { headers: { 'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10' } },
  );
}
