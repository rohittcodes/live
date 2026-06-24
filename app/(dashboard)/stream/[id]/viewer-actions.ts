'use server';

import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { RoomServiceClient } from 'livekit-server-sdk';
import { assertAuth, assertOwnerOrAdmin, AuthError } from '@/lib/auth';
import db from '@/lib/db';
import { streams, streamMembers, streamBans, users } from '@/lib/db/schema';
import { joinRequestLimiter, getIp } from '@/lib/ratelimit';
import { sendJoinRequestReceivedEmail } from '@/lib/email';

export async function requestToJoin(streamId: string) {
  const user = await assertAuth();
  if (user.isBanned) throw new AuthError(403, 'Account banned');

  if (joinRequestLimiter) {
    const { success } = await joinRequestLimiter.limit(user.id);
    if (!success) throw new AuthError(429 as never, 'Too many join requests. Try again in a minute.');
  }

  const stream = await db.query.streams.findFirst({ where: eq(streams.id, streamId) });
  if (!stream) throw new AuthError(404 as never, 'Stream not found');

  const ban = await db.query.streamBans.findFirst({
    where: and(eq(streamBans.streamId, streamId), eq(streamBans.userId, user.id)),
  });
  if (ban) throw new AuthError(403, 'You are banned from this stream');

  const existing = await db.query.streamMembers.findFirst({
    where: and(eq(streamMembers.streamId, streamId), eq(streamMembers.userId, user.id)),
  });
  if (!existing) {
    await db.insert(streamMembers).values({ streamId, userId: user.id, status: 'pending' });
    // Fire-and-forget email to admin
    sendJoinRequestReceivedEmail({
      streamTitle: stream.title,
      requesterName: user.name,
      streamId,
    }).catch(() => {});
  }
  revalidatePath(`/stream/${streamId}`);
}

export async function kickParticipant(streamId: string, targetUserId: string) {
  const stream = await db.query.streams.findFirst({ where: eq(streams.id, streamId) });
  if (!stream) throw new AuthError(404 as never, 'Stream not found');
  await assertOwnerOrAdmin(stream.hostId);

  if (stream.livekitRoomName) {
    const roomService = new RoomServiceClient(
      process.env.NEXT_PUBLIC_LIVEKIT_URL!,
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!,
    );
    try { await roomService.removeParticipant(stream.livekitRoomName, targetUserId); } catch {}
  }
}

export async function banParticipant(streamId: string, targetUserId: string) {
  const stream = await db.query.streams.findFirst({ where: eq(streams.id, streamId) });
  if (!stream) throw new AuthError(404 as never, 'Stream not found');
  await assertOwnerOrAdmin(stream.hostId);

  // Kick from room first
  if (stream.livekitRoomName) {
    const roomService = new RoomServiceClient(
      process.env.NEXT_PUBLIC_LIVEKIT_URL!,
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!,
    );
    try { await roomService.removeParticipant(stream.livekitRoomName, targetUserId); } catch {}
  }

  // Upsert ban and revoke membership so the token endpoint won't issue new publish tokens
  await Promise.all([
    db.insert(streamBans)
      .values({ streamId, userId: targetUserId })
      .onConflictDoNothing(),
    db.update(streamMembers)
      .set({ status: 'rejected' })
      .where(and(eq(streamMembers.streamId, streamId), eq(streamMembers.userId, targetUserId))),
  ]);

  revalidatePath(`/stream/${streamId}`);
}
