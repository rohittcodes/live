'use server';

import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { assertOwnerOrAdmin, assertAuth } from '@/lib/auth';
import db from '@/lib/db';
import { streams, streamPolls, streamPollVotes } from '@/lib/db/schema';

export async function createPoll(streamId: string, question: string, options: string[]) {
  const stream = await db.query.streams.findFirst({ where: eq(streams.id, streamId) });
  if (!stream) throw new Error('Stream not found.');
  const user = await assertOwnerOrAdmin(stream.hostId);
  if (options.length < 2 || options.length > 4) throw new Error('Polls require 2–4 options.');

  const [poll] = await db
    .insert(streamPolls)
    .values({ streamId, createdBy: user.id, question, options })
    .returning();

  revalidatePath(`/stream/${streamId}`);
  return poll;
}

export async function votePoll(pollId: string, optionIndex: number) {
  const user = await assertAuth();

  const poll = await db.query.streamPolls.findFirst({ where: eq(streamPolls.id, pollId) });
  if (!poll || !poll.isActive) throw new Error('Poll not found or closed.');
  if (optionIndex < 0 || optionIndex >= poll.options.length) throw new Error('Invalid option.');

  const existing = await db.query.streamPollVotes.findFirst({
    where: and(eq(streamPollVotes.pollId, pollId), eq(streamPollVotes.userId, user.id)),
  });
  if (existing) return; // already voted

  await db.insert(streamPollVotes).values({ pollId, userId: user.id, optionIndex });
}

export async function closePoll(pollId: string) {
  const poll = await db.query.streamPolls.findFirst({ where: eq(streamPolls.id, pollId) });
  if (!poll) throw new Error('Poll not found.');
  const stream = await db.query.streams.findFirst({ where: eq(streams.id, poll.streamId) });
  if (!stream) throw new Error('Stream not found.');
  await assertOwnerOrAdmin(stream.hostId);
  await db.update(streamPolls).set({ isActive: false }).where(eq(streamPolls.id, pollId));
}

export async function getActivePoll(streamId: string) {
  const poll = await db.query.streamPolls.findFirst({
    where: and(eq(streamPolls.streamId, streamId), eq(streamPolls.isActive, true)),
    with: { votes: true },
    orderBy: (t, { desc }) => desc(t.createdAt),
  });
  return poll ?? null;
}
