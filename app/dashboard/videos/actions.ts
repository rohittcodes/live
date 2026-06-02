'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { assertAdmin } from '@/lib/auth';
import db from '@/lib/db';
import { videos } from '@/lib/db/schema';

export async function togglePublish(id: string, publish: boolean) {
  await assertAdmin();
  await db.update(videos).set({ isPublished: publish, updatedAt: new Date() }).where(eq(videos.id, id));
  revalidatePath('/dashboard/videos');
}

export async function deleteVideo(id: string) {
  await assertAdmin();
  const video = await db.query.videos.findFirst({ where: eq(videos.id, id) });
  if (!video) return;

  if (video.cloudflareVideoId) {
    try {
      await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/stream/${video.cloudflareVideoId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_STREAM_API_TOKEN}` },
        },
      );
    } catch { /* continue even if Cloudflare fails */ }
  }

  await db.delete(videos).where(eq(videos.id, id));
  revalidatePath('/dashboard/videos');
}
