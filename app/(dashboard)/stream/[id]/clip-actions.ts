'use server';

import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { assertAuth } from '@/lib/auth';
import db from '@/lib/db';
import { streamClips, streams } from '@/lib/db/schema';
import { clipLimiter, getIp } from '@/lib/ratelimit';

export async function createClip(streamId: string, label?: string) {
  const user = await assertAuth();

  if (clipLimiter) {
    const h = await headers();
    const { success } = await clipLimiter.limit(user.id ?? getIp(h));
    if (!success) throw new Error('Too many clips. Slow down.');
  }

  const stream = await db.query.streams.findFirst({ where: eq(streams.id, streamId) });
  if (!stream?.isLive) throw new Error('Stream is not live.');

  // startedAt is not tracked; approximate via updatedAt or use a fixed reference
  // We store absolute Date.now() as timestampSeconds from epoch for now —
  // the dashboard can display actual timestamps
  const timestampSeconds = Math.floor(Date.now() / 1000);

  const [clip] = await db
    .insert(streamClips)
    .values({
      streamId,
      userId: user.id,
      label: label?.trim() || null,
      timestampSeconds,
    })
    .returning();

  return clip;
}

export async function getStreamClips(streamId: string) {
  return db.query.streamClips.findMany({
    where: eq(streamClips.streamId, streamId),
    orderBy: (t, { asc }) => asc(t.timestampSeconds),
  });
}
