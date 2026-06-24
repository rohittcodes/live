'use server';

import { eq } from 'drizzle-orm';
import { requireOwnerOrAdmin } from '@/lib/auth';
import db from '@/lib/db';
import { videos } from '@/lib/db/schema';

type ChapterInput = {
  clipId: string;
  timestampSeconds: number;
  title: string;
};

export async function saveClipsAsChapters(videoId: string, chapters: ChapterInput[]) {
  const video = await db.query.videos.findFirst({ where: eq(videos.id, videoId) });
  if (!video) throw new Error('Video not found.');
  await requireOwnerOrAdmin(video.hostId);

  const mapped = chapters.map((c) => ({
    time: c.timestampSeconds,
    title: c.title,
  }));

  await db.update(videos).set({ chapters: mapped, updatedAt: new Date() }).where(eq(videos.id, videoId));
}
