import { notFound } from 'next/navigation';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';
import { RadioIcon, CopyIcon, ExternalLinkIcon, UsersIcon } from 'lucide-react';
import { requireAdmin, requireOwnerOrAdmin } from '@/lib/auth';
import db from '@/lib/db';
import { streams, streamMembers, streamClips, streamBans } from '@/lib/db/schema';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StreamCredentials } from './credentials';
import { JoinRequestActions } from './join-request-actions';
import { EndStreamButton } from './end-stream-button';
import { RecordingButton } from './recording-button';
import { OverlaysCard } from './overlays-card';
import { CreatePollDialog } from './create-poll-dialog';
import { ClipsPanel } from './clips-panel';
import { ChatSettingsCard } from './chat-settings-card';
import { EditStreamInfoForm } from './edit-stream-info-form';
import { BreadcrumbLabel } from '@/components/breadcrumb-labels';
import { StreamBansPanel } from './stream-bans-panel';

export default async function StreamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const stream = await db.query.streams.findFirst({
    where: eq(streams.id, id),
    with: { host: true },
  });
  if (!stream) notFound();

  await requireOwnerOrAdmin(stream.hostId);

  const [joinRequests, clips, bans] = await Promise.all([
    db.query.streamMembers.findMany({
      where: eq(streamMembers.streamId, id),
      with: { user: true },
      orderBy: desc(streamMembers.createdAt),
    }),
    db.query.streamClips.findMany({
      where: eq(streamClips.streamId, id),
      orderBy: (t, { asc }) => asc(t.timestampSeconds),
    }),
    db.query.streamBans.findMany({
      where: eq(streamBans.streamId, id),
      with: { user: true },
      orderBy: (t, { desc: d }) => d(t.createdAt),
    }),
  ]);

  const pending = joinRequests.filter((r) => r.status === 'pending');
  const accepted = joinRequests.filter((r) => r.status === 'accepted');

  // Extract video ID from recordingUrl ("/videos/{id}") if recording is complete
  const recordingVideoId = stream.recordingUrl?.startsWith('/videos/')
    ? stream.recordingUrl.replace('/videos/', '')
    : null;

  return (
    <div className="w-full p-4 space-y-4 max-w-3xl">
      <BreadcrumbLabel id={id} name={stream.title} />
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <RadioIcon className="size-4 text-muted-foreground shrink-0" />
            {stream.isLive
              ? <Badge variant="destructive" className="animate-pulse text-[10px] shrink-0">LIVE</Badge>
              : <Badge variant="secondary" className="text-[10px] shrink-0">Offline</Badge>}
          </div>
          <EditStreamInfoForm streamId={stream.id} title={stream.title} category={stream.category ?? null} />
        </div>
        <div className="flex gap-2 flex-wrap justify-end shrink-0">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/stream/${stream.id}`} target="_blank">
              <ExternalLinkIcon className="mr-1.5 size-3.5" />
              View Stream
            </Link>
          </Button>
          {!stream.isLive && stream.totalViews > 0 && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/stream/${stream.id}/recap`}>
                View Recap
              </Link>
            </Button>
          )}
          {stream.isLive && <CreatePollDialog streamId={stream.id} />}
          {stream.isLive && <RecordingButton streamId={stream.id} egressId={stream.egressId ?? null} recordingStatus={stream.recordingStatus ?? null} />}
          {stream.isLive && <EndStreamButton id={stream.id} />}
        </div>
      </div>

      {/* RTMP Credentials */}
      <Card>
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-sm font-semibold">RTMP Credentials</CardTitle>
          <CardDescription className="text-xs">Use these in OBS or any RTMP encoder to go live.</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="px-4 py-4">
          <StreamCredentials
            serverUrl={stream.rtmpUrl ?? ''}
            streamKey={stream.streamKey}
          />
        </CardContent>
      </Card>

      {/* OBS Overlays */}
      {stream.livekitRoomName && (
        <Card>
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-sm font-semibold">OBS Overlays</CardTitle>
            <CardDescription className="text-xs">Browser source URLs to add over your stream in OBS.</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="px-4 py-4">
            <OverlaysCard streamId={stream.id} roomName={stream.livekitRoomName} />
          </CardContent>
        </Card>
      )}

      {/* Chat Moderation */}
      <ChatSettingsCard
        streamId={stream.id}
        initial={stream.chatSettings ?? { slowModeSeconds: null, followersOnly: false, wordFilters: [] }}
      />

      {/* Clips & Chapters */}
      {clips.length > 0 && (
        <Card>
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-sm font-semibold">Clip Bookmarks</CardTitle>
            <CardDescription className="text-xs">Moments bookmarked during the stream. Save as video chapters once recording is ready.</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="px-4 py-4">
            <ClipsPanel clips={clips} videoId={recordingVideoId} />
          </CardContent>
        </Card>
      )}

      <StreamBansPanel bans={bans} streamId={id} />

      {/* Join Requests */}
      <Card>
        <CardHeader className="px-4 py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Join Requests</CardTitle>
            {pending.length > 0 && (
              <Badge variant="destructive" className="text-[10px]">{pending.length} pending</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {joinRequests.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">No join requests yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead className="text-right">Status / Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {joinRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.user.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(req.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell className="text-right">
                      {req.status === 'pending' ? (
                        <JoinRequestActions memberId={req.id} streamId={stream.id} />
                      ) : (
                        <Badge variant={req.status === 'accepted' ? 'default' : 'secondary'} className="text-[10px]">
                          {req.status}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
