'use server';

import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { assertOwnerOrAdmin, AuthError } from '@/lib/auth';
import db from '@/lib/db';
import { streams, streamMembers } from '@/lib/db/schema';

export async function handleJoinRequest(
  memberId: string,
  streamId: string,
  status: 'accepted' | 'rejected',
) {
  const stream = await db.query.streams.findFirst({ where: eq(streams.id, streamId) });
  if (!stream) throw new AuthError(404 as never, 'Stream not found');
  await assertOwnerOrAdmin(stream.hostId);
  await db
    .update(streamMembers)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(streamMembers.id, memberId), eq(streamMembers.streamId, streamId)));
  revalidatePath(`/dashboard/streams/${streamId}`);
  revalidatePath(`/stream/${streamId}`);
}
