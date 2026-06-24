'use server';

import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import { videoProgress } from '@/lib/db/schema';

export async function saveVideoProgress(videoId: string, positionSeconds: number) {
  const user = await getCurrentUser();
  if (!user) return;

  await db
    .insert(videoProgress)
    .values({ videoId, userId: user.id, positionSeconds })
    .onConflictDoUpdate({
      target: [videoProgress.videoId, videoProgress.userId],
      set: { positionSeconds, updatedAt: new Date() },
    });
}

export async function getVideoProgress(videoId: string): Promise<number> {
  const user = await getCurrentUser();
  if (!user) return 0;

  const record = await db.query.videoProgress.findFirst({
    where: and(eq(videoProgress.videoId, videoId), eq(videoProgress.userId, user.id)),
  });

  return record?.positionSeconds ?? 0;
}
