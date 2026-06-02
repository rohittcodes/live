'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { assertAdmin, AuthError } from '@/lib/auth';
import db from '@/lib/db';
import { communityPosts } from '@/lib/db/schema';

export async function createPost(data: {
  title: string;
  content: string;
  type: 'post' | 'announcement' | 'update';
  tags: string[];
  imageUrls: string[];
  publish: boolean;
}) {
  try {
    const user = await assertAdmin();
    const now = new Date();
    await db.insert(communityPosts).values({
      authorId: user.id,
      title: data.title.trim(),
      content: data.content.trim(),
      type: data.type,
      tags: data.tags,
      imageUrls: data.imageUrls,
      isPublished: data.publish,
      publishedAt: data.publish ? now : null,
    });
    revalidatePath('/dashboard/community');
    revalidatePath('/community');
  } catch (err) {
    if (err instanceof AuthError) throw err;
    throw err;
  }
}

export async function togglePublishPost(id: string, publish: boolean) {
  try {
    await assertAdmin();
    await db
      .update(communityPosts)
      .set({
        isPublished: publish,
        publishedAt: publish ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(communityPosts.id, id));
    revalidatePath('/dashboard/community');
    revalidatePath('/community');
  } catch (err) {
    if (err instanceof AuthError) throw err;
  }
}

export async function deletePost(id: string) {
  try {
    await assertAdmin();
    await db.delete(communityPosts).where(eq(communityPosts.id, id));
    revalidatePath('/dashboard/community');
    revalidatePath('/community');
  } catch (err) {
    if (err instanceof AuthError) throw err;
  }
}
