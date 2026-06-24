'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { HeartIcon, MessageSquareIcon, Trash2Icon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toggleLike, addComment, deleteComment } from './actions';

type SafeUser = { id: string; name: string; imageUrl: string | null };
type SafeComment = {
  id: string;
  content: string;
  createdAt: string;
  user: SafeUser;
};

type Props = {
  postId: string;
  postAuthorId: string;
  initialLikesCount: number;
  initialLiked: boolean;
  initialComments: SafeComment[];
  currentUser: SafeUser | null;
  isAdmin: boolean;
};

export function PostEngagement({
  postId,
  postAuthorId,
  initialLikesCount,
  initialLiked,
  initialComments,
  currentUser,
  isAdmin,
}: Props) {
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [likePending, startLikeTransition] = useTransition();
  const [commentPending, startCommentTransition] = useTransition();

  function handleLike() {
    if (!currentUser) return;
    const next = !liked;
    setLiked(next);
    setLikesCount((c) => c + (next ? 1 : -1));
    startLikeTransition(async () => {
      try {
        await toggleLike(postId);
      } catch {
        setLiked(!next);
        setLikesCount((c) => c + (next ? -1 : 1));
      }
    });
  }

  function handleSubmitComment() {
    if (!currentUser) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    setError(null);

    const optimistic: SafeComment = {
      id: `optimistic-${Date.now()}`,
      content: trimmed,
      createdAt: new Date().toISOString(),
      user: currentUser,
    };
    setComments((prev) => [optimistic, ...prev]);
    setText('');

    startCommentTransition(async () => {
      try {
        await addComment(postId, trimmed);
      } catch {
        setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
        setError('Could not post your comment. Try again.');
      }
    });
  }

  function handleDeleteComment(commentId: string) {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    startCommentTransition(async () => {
      await deleteComment(commentId);
    });
  }

  return (
    <div className="space-y-6 pt-2">
      {/* Like + comment counts */}
      <div className="flex items-center gap-3 border-y py-3">
        <Button
          variant="ghost"
          size="sm"
          disabled={!currentUser || likePending}
          onClick={handleLike}
          className={cn('gap-1.5', liked && 'text-rose-500 hover:text-rose-500')}
        >
          <HeartIcon className={cn('size-4', liked && 'fill-rose-500')} />
          {likesCount} {likesCount === 1 ? 'like' : 'likes'}
        </Button>
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MessageSquareIcon className="size-4" />
          {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </span>
      </div>

      {/* Comment form */}
      {currentUser ? (
        <div className="flex gap-3">
          <Avatar size="sm">
            <AvatarImage src={currentUser.imageUrl ?? undefined} alt={currentUser.name} />
            <AvatarFallback>{currentUser.name.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Add a comment…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-20"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex justify-end">
              <Button size="sm" disabled={!text.trim() || commentPending} onClick={handleSubmitComment}>
                Comment
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          <Link href="/sign-in" className="text-primary underline underline-offset-4">Sign in</Link> to like and comment.
        </p>
      )}

      {/* Comments list */}
      <div className="space-y-4">
        {comments.map((comment) => {
          const canDelete = isAdmin || comment.user.id === currentUser?.id || postAuthorId === currentUser?.id;
          return (
            <div key={comment.id} className="flex gap-3">
              <Avatar size="sm">
                <AvatarImage src={comment.user.imageUrl ?? undefined} alt={comment.user.name} />
                <AvatarFallback>{comment.user.name.slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{comment.user.name}</span>
                  {comment.user.id === postAuthorId && (
                    <span className="text-[10px] text-muted-foreground">· Author</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap break-words">{comment.content}</p>
              </div>
              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 shrink-0 text-muted-foreground"
                  onClick={() => handleDeleteComment(comment.id)}
                >
                  <Trash2Icon className="size-3" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
