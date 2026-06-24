'use server';

import { and, eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { assertAuth, AuthError } from '@/lib/auth';
import db from '@/lib/db';
import { communityPosts, postLikes, postComments } from '@/lib/db/schema';

export async function toggleLike(postId: string) {
  const user = await assertAuth();

  const existing = await db.query.postLikes.findFirst({
    where: and(eq(postLikes.postId, postId), eq(postLikes.userId, user.id)),
  });

  if (existing) {
    await db.delete(postLikes).where(eq(postLikes.id, existing.id));
    await db
      .update(communityPosts)
      .set({ likesCount: sql`${communityPosts.likesCount} - 1` })
      .where(eq(communityPosts.id, postId));
  } else {
    await db.insert(postLikes).values({ postId, userId: user.id });
    await db
      .update(communityPosts)
      .set({ likesCount: sql`${communityPosts.likesCount} + 1` })
      .where(eq(communityPosts.id, postId));
  }

  revalidatePath(`/community/${postId}`);
  return { liked: !existing };
}

export async function addComment(postId: string, content: string) {
  const user = await assertAuth();
  const trimmed = content.trim();
  if (!trimmed) throw new Error('Comment cannot be empty');
  if (trimmed.length > 1000) throw new Error('Comment is too long');

  await db.insert(postComments).values({ postId, userId: user.id, content: trimmed });
  await db
    .update(communityPosts)
    .set({ commentsCount: sql`${communityPosts.commentsCount} + 1` })
    .where(eq(communityPosts.id, postId));

  revalidatePath(`/community/${postId}`);
}

export async function deleteComment(commentId: string) {
  const user = await assertAuth();

  const comment = await db.query.postComments.findFirst({
    where: eq(postComments.id, commentId),
    with: { post: true },
  });
  if (!comment) return;

  const canDelete =
    comment.userId === user.id ||
    comment.post.authorId === user.id ||
    user.role === 'admin';
  if (!canDelete) throw new AuthError(403, 'Forbidden');

  await db.delete(postComments).where(eq(postComments.id, commentId));
  await db
    .update(communityPosts)
    .set({ commentsCount: sql`${communityPosts.commentsCount} - 1` })
    .where(eq(communityPosts.id, comment.postId));

  revalidatePath(`/community/${comment.postId}`);
}
