'use server';

import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { assertOwnerOrAdmin, AuthError } from '@/lib/auth';
import db from '@/lib/db';
import { streams, streamMembers, streamBans, users } from '@/lib/db/schema';
import { sendJoinRequestResponseEmail } from '@/lib/email';

type ChatSettings = {
  slowModeSeconds: number | null;
  followersOnly: boolean;
  wordFilters: string[];
};

export async function updateChatSettings(streamId: string, settings: ChatSettings) {
  const stream = await db.query.streams.findFirst({ where: eq(streams.id, streamId) });
  if (!stream) throw new AuthError(404 as never, 'Stream not found');
  await assertOwnerOrAdmin(stream.hostId);
  await db.update(streams).set({ chatSettings: settings }).where(eq(streams.id, streamId));
  revalidatePath(`/dashboard/streams/${streamId}`);
}

export async function updateStreamInfo(
  streamId: string,
  data: { title: string; category: string | null },
) {
  const stream = await db.query.streams.findFirst({ where: eq(streams.id, streamId) });
  if (!stream) throw new AuthError(404 as never, 'Stream not found');
  await assertOwnerOrAdmin(stream.hostId);
  const title = data.title.trim();
  if (!title || title.length > 120) throw new Error('Title must be 1–120 characters.');
  await db
    .update(streams)
    .set({ title, category: data.category || null, updatedAt: new Date() })
    .where(eq(streams.id, streamId));
  revalidatePath(`/dashboard/streams/${streamId}`);
  revalidatePath(`/stream/${streamId}`);
}

export async function unbanUser(streamId: string, userId: string) {
  const stream = await db.query.streams.findFirst({ where: eq(streams.id, streamId) });
  if (!stream) throw new AuthError(404 as never, 'Stream not found');
  await assertOwnerOrAdmin(stream.hostId);
  await db.delete(streamBans).where(and(eq(streamBans.streamId, streamId), eq(streamBans.userId, userId)));
  revalidatePath(`/dashboard/streams/${streamId}`);
}

export async function handleJoinRequest(
  memberId: string,
  streamId: string,
  status: 'accepted' | 'rejected',
) {
  const stream = await db.query.streams.findFirst({ where: eq(streams.id, streamId) });
  if (!stream) throw new AuthError(404 as never, 'Stream not found');
  await assertOwnerOrAdmin(stream.hostId);
  const [member] = await db
    .update(streamMembers)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(streamMembers.id, memberId), eq(streamMembers.streamId, streamId)))
    .returning({ userId: streamMembers.userId });

  // Notify the viewer of the decision
  if (member?.userId) {
    const viewer = await db.query.users.findFirst({ where: eq(users.id, member.userId) });
    if (viewer?.email) {
      sendJoinRequestResponseEmail({
        to: viewer.email,
        userName: viewer.name,
        streamTitle: stream.title,
        status,
        streamId,
      }).catch(() => {});
    }
  }

  revalidatePath(`/dashboard/streams/${streamId}`);
  revalidatePath(`/stream/${streamId}`);
}
