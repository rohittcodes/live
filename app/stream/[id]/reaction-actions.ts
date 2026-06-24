'use server';

import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import { streams, reactions } from '@/lib/db/schema';
import { getIp, reactionLimiter } from '@/lib/ratelimit';

export async function saveReaction(
  streamId: string,
  type: 'heart' | 'fire' | 'clap' | 'wow' | 'laugh',
) {
  const user = await getCurrentUser();
  if (!user) return;

  if (reactionLimiter) {
    const h = await headers();
    const { success } = await reactionLimiter.limit(user.id ?? getIp(h));
    if (!success) throw new Error('Too many reactions. Slow down.');
  }

  // Verify the stream exists and is currently live before persisting
  const stream = await db.query.streams.findFirst({ where: eq(streams.id, streamId) });
  if (!stream?.isLive) return;

  await db.insert(reactions).values({ streamId, userId: user.id, type });
}
