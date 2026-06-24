import { eq, and, or, ilike } from 'drizzle-orm';
import { type NextRequest } from 'next/server';
import db from '@/lib/db';
import { streams, videos, users, communityPosts } from '@/lib/db/schema';
import { searchLimiter, getIp } from '@/lib/ratelimit';

export async function GET(req: NextRequest) {
  const ip = getIp(req.headers);

  if (searchLimiter) {
    const { success } = await searchLimiter.limit(ip);
    if (!success) return Response.json({ error: 'Too many requests' }, { status: 429 });
  }

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return Response.json({ streams: [], videos: [], creators: [], posts: [] });
  if (q.length > 100) return Response.json({ error: 'Query too long' }, { status: 400 });

  // Escape % and _ for ilike
  const term = `%${q.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;

  const [streamResults, videoResults, creatorResults, postResults] = await Promise.all([
    db.query.streams.findMany({
      where: or(ilike(streams.title, term), ilike(streams.category, term)),
      with: { host: true },
      limit: 5,
    }),
    db.query.videos.findMany({
      where: and(
        eq(videos.isPublished, true),
        or(ilike(videos.title, term), ilike(videos.description, term)),
      ),
      with: { host: true },
      limit: 5,
    }),
    db.query.users.findMany({
      where: or(ilike(users.name, term), ilike(users.username, term)),
      limit: 5,
    }),
    db.query.communityPosts.findMany({
      where: and(
        eq(communityPosts.isPublished, true),
        or(ilike(communityPosts.title, term), ilike(communityPosts.content, term)),
      ),
      with: { author: true },
      limit: 5,
    }),
  ]);

  return Response.json({
    streams: streamResults.map((s) => ({
      id: s.id,
      title: s.title,
      isLive: s.isLive,
      host: s.host.name,
    })),
    videos: videoResults.map((v) => ({
      id: v.id,
      title: v.title,
      host: v.host.name,
    })),
    creators: creatorResults.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      imageUrl: u.imageUrl,
    })),
    posts: postResults.map((p) => ({
      id: p.id,
      title: p.title,
      author: p.author.name,
    })),
  });
}
