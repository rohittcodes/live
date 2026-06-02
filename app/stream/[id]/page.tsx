import { eq, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import { streams, streamMembers, type StreamMember, type User } from '@/lib/db/schema';
import { StreamViewer } from './viewer';

// Fields that are safe to send to the client. Never include streamKey, rtmpUrl, ingressId.
type SafeStream = {
  id: string;
  title: string;
  isLive: boolean;
  livekitRoomName: string | null;
  recordingStatus: string | null;
  egressId: string | null;
  host: { name: string };
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

  // Host/admin gets the pending requests list
  let pendingRequests: (StreamMember & { user: User })[] = [];
  if (canManage) {
    pendingRequests = await db.query.streamMembers.findMany({
      where: and(eq(streamMembers.streamId, id), eq(streamMembers.status, 'pending')),
      with: { user: true },
    }) as (StreamMember & { user: User })[];
  }

  const safeStream: SafeStream = {
    id: stream.id,
    title: stream.title,
    isLive: stream.isLive,
    livekitRoomName: stream.livekitRoomName,
    recordingStatus: stream.recordingStatus ?? null,
    egressId: canManage ? (stream.egressId ?? null) : null,
    host: { name: stream.host.name },
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <StreamViewer
        stream={safeStream}
        viewerUserId={viewer?.id ?? null}
        isHost={canManage}
        memberStatus={memberStatus}
        pendingRequests={pendingRequests}
      />
    </div>
  );
}
