import { eq, and, count } from 'drizzle-orm';
import { type NextRequest } from 'next/server';
import { assertAuth } from '@/lib/auth';
import db from '@/lib/db';
import { follows } from '@/lib/db/schema';

async function getFollowerCount(followingId: string) {
  const result = await db.select({ total: count() }).from(follows).where(eq(follows.followingId, followingId));
  return result[0]?.total ?? 0;
}

/** POST /api/follow  — follow a creator */
export async function POST(req: NextRequest) {
  try {
    const user = await assertAuth();
    const { followingId } = await req.json() as { followingId?: string };
    if (!followingId) return Response.json({ error: 'followingId is required' }, { status: 400 });
    if (followingId === user.id) return Response.json({ error: 'Cannot follow yourself' }, { status: 400 });

    await db.insert(follows).values({
      followerId: user.id,
      followingId,
    }).onConflictDoNothing();

    const followerCount = await getFollowerCount(followingId);
    return Response.json({ following: true, followerCount });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Unauthorized' }, { status });
  }
}

/** DELETE /api/follow  — unfollow a creator */
export async function DELETE(req: NextRequest) {
  try {
    const user = await assertAuth();
    const { followingId } = await req.json() as { followingId?: string };
    if (!followingId) return Response.json({ error: 'followingId is required' }, { status: 400 });

    await db.delete(follows).where(
      and(eq(follows.followerId, user.id), eq(follows.followingId, followingId))
    );

    const followerCount = await getFollowerCount(followingId);
    return Response.json({ following: false, followerCount });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: 'Unauthorized' }, { status });
  }
}
