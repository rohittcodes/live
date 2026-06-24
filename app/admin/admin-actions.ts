'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { assertAdmin } from '@/lib/auth';
import db from '@/lib/db';
import { streams, videos } from '@/lib/db/schema';

export async function deleteStream(streamId: string) {
  await assertAdmin();
  await db.delete(streams).where(eq(streams.id, streamId));
  revalidatePath('/admin');
}

export async function deleteVideo(videoId: string) {
  await assertAdmin();
  await db.delete(videos).where(eq(videos.id, videoId));
  revalidatePath('/admin');
}

export async function toggleVideoPublish(videoId: string, isPublished: boolean) {
  await assertAdmin();
  await db.update(videos).set({ isPublished, updatedAt: new Date() }).where(eq(videos.id, videoId));
  revalidatePath('/admin');
}
