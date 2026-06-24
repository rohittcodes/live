import type { Metadata } from 'next';
import { eq, and, count } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import { streams, streamMembers, follows, type StreamMember } from '@/lib/db/schema';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const stream = await db.query.streams.findFirst({ where: eq(streams.id, id), with: { host: true } });
  if (!stream) return {};
  const title = stream.isLive ? `🔴 ${stream.title}` : stream.title;
  return {
    title,
    description: `Stream by ${stream.host.name}${stream.category ? ` · ${stream.category}` : ''}`,
    openGraph: {
      title,
      description: `Watch ${stream.host.name} on Live`,
      images: stream.thumbnailUrl ? [stream.thumbnailUrl] : [],
    },
    twitter: { card: 'summary_large_image', title, description: `Watch ${stream.host.name} on Live` },
  };
}
import { StreamViewer } from './viewer';
import { FollowButton } from '@/components/follow-button';
import { Button } from '@/components/ui/button';

// Fields that are safe to send to the client. Never include streamKey, rtmpUrl, ingressId.
type SafeStream = {
  id: string;
  title: string;
  isLive: boolean;
  scheduledAt: string | null;
  thumbnailUrl: string | null;
  livekitRoomName: string | null;
  recordingStatus: string | null;
  egressId: string | null;
  host: { name: string };
  chatSettings: { slowModeSeconds: number | null; followersOnly: boolean; wordFilters: string[] } | null;
  totalViews: number;
};

export default async function StreamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [stream, viewer] = await Promise.all([
    db.query.streams.findFirst({ where: eq(streams.id, id), with: { host: true } }),
    getCurrentUser(),
  ]);

  if (!stream) notFound();

  const isHost = viewer?.id === stream.hostId;
  const isAdmin = viewer?.role === 'admin';
  const canManage = isHost || isAdmin;

  // Check if viewer has a join request
  let memberStatus: 'none' | 'pending' | 'accepted' | 'rejected' = 'none';
  if (viewer && !canManage) {
    const member = await db.query.streamMembers.findFirst({
      where: and(eq(streamMembers.streamId, id), eq(streamMembers.userId, viewer.id)),
    });
    memberStatus = (member?.status as typeof memberStatus) ?? 'none';
  }

  type SafeRequestUser = { id: string; name: string; username: string | null; imageUrl: string | null };
  type SafePendingRequest = StreamMember & { user: SafeRequestUser };

  // Host/admin gets the pending requests list (email excluded from user projection)
  let pendingRequests: SafePendingRequest[] = [];
  if (canManage) {
    const rows = await db.query.streamMembers.findMany({
      where: and(eq(streamMembers.streamId, id), eq(streamMembers.status, 'pending')),
      with: { user: { columns: { id: true, name: true, username: true, imageUrl: true } } },
    });
    pendingRequests = rows as SafePendingRequest[];
  }

  // Follow state
  const [followerCountResult, isFollowingResult] = await Promise.all([
    db.select({ total: count() }).from(follows).where(eq(follows.followingId, stream.hostId)),
    viewer && !canManage
      ? db.query.follows.findFirst({
          where: and(eq(follows.followerId, viewer.id), eq(follows.followingId, stream.hostId)),
        })
      : Promise.resolve(null),
  ]);
  const followerCount = followerCountResult[0]?.total ?? 0;
  const isFollowing = !!isFollowingResult;

  const safeStream: SafeStream = {
    id: stream.id,
    title: stream.title,
    isLive: stream.isLive,
    scheduledAt: stream.scheduledAt?.toISOString() ?? null,
    thumbnailUrl: stream.thumbnailUrl ?? null,
    livekitRoomName: stream.livekitRoomName,
    recordingStatus: stream.recordingStatus ?? null,
    egressId: canManage ? (stream.egressId ?? null) : null,
    host: { name: stream.host.name },
    chatSettings: stream.chatSettings ?? null,
    totalViews: stream.totalViews,
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b px-4 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm text-muted-foreground truncate">by {stream.host.name}</span>
          {viewer && !canManage && (
            <FollowButton
              followingId={stream.hostId}
              initialIsFollowing={isFollowing}
              initialCount={followerCount}
            />
          )}
        </div>
        {!stream.isLive && stream.totalViews > 0 && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/stream/${id}/recap`}>View recap →</Link>
          </Button>
        )}
      </div>
      <div className="flex flex-1 overflow-hidden">
        <StreamViewer
          stream={safeStream}
          viewerUserId={viewer?.id ?? null}
          isHost={canManage}
          memberStatus={memberStatus}
          pendingRequests={pendingRequests}
        />
      </div>
    </div>
  );
}
