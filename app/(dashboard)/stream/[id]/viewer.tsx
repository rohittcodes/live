'use client';

import React, { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  useTracks,
  useLocalParticipant,
  useParticipants,
  useChat,
  RoomAudioRenderer,
  useTrackToggle,
  useDisconnectButton,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';
import {
  MicIcon, MicOffIcon,
  CameraIcon, CameraOffIcon,
  MonitorUpIcon, MonitorOffIcon,
  PhoneOffIcon,
  CheckIcon, XIcon,
  UserMinusIcon, BanIcon,
  CircleIcon, CircleStopIcon,
  EyeIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useBreadcrumbLabels } from '@/components/breadcrumb-labels';
import { requestToJoin, kickParticipant, banParticipant } from './viewer-actions';
import { startRecording, stopRecording } from '@/app/(dashboard)/dashboard/streams/[id]/recording-actions';
import { handleJoinRequest } from '@/app/(dashboard)/dashboard/streams/[id]/actions';
import { goLive, endStream } from '@/app/(dashboard)/dashboard/streams/actions';
import { ReactionsOverlay } from './reactions';
import { Countdown } from './countdown';
import { PollPanel } from './poll-panel';
import { ClipButton } from './clip-button';
import { useStreamStatus } from './use-stream-status';
import { useKeyboardShortcuts } from './use-keyboard-shortcuts';
import type { StreamMember } from '@/lib/db/schema';

type SafeRequestUser = { id: string; name: string; username: string | null; imageUrl: string | null };
type SafePendingRequest = StreamMember & { user: SafeRequestUser };

type MemberStatus = 'none' | 'pending' | 'accepted' | 'rejected';

type ChatSettings = {
  slowModeSeconds: number | null;
  followersOnly: boolean;
  wordFilters: string[];
};

// Only fields the viewer UI needs — never include streamKey, rtmpUrl, ingressId
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
  chatSettings: ChatSettings | null;
  totalViews: number;
};

type Props = {
  stream: SafeStream;
  viewerUserId: string | null;
  isHost: boolean;
  memberStatus: MemberStatus;
  pendingRequests: SafePendingRequest[];
};

export function StreamViewer({ stream, viewerUserId, isHost, memberStatus, pendingRequests }: Props) {
  const tokenType = isHost ? 'host' : memberStatus === 'accepted' ? 'participant' : 'viewer';
  const [token, setToken] = useState<string | null>(null);
  const [streamEnded, setStreamEnded] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const reactRef = useRef<((type: 'heart' | 'fire' | 'clap' | 'wow' | 'laugh') => void) | null>(null);
  const { setLabel } = useBreadcrumbLabels();
  const { viewerCount } = useStreamStatus(stream.id, stream.isLive, stream.title);

  useEffect(() => { setLabel(stream.id, stream.title); }, [stream.id, stream.title]);

  useEffect(() => {
    if (!stream.livekitRoomName) return;
    fetch(`/api/livekit/token?room=${stream.livekitRoomName}&type=${tokenType}`)
      .then((r) => r.json())
      .then((d) => setToken(d.token));
  }, [stream.livekitRoomName, tokenType]);

  const isScheduled = !stream.isLive && stream.scheduledAt && new Date(stream.scheduledAt) > new Date();

  if (!stream.isLive) {
    if (isHost) {
      return (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center space-y-4">
            {stream.thumbnailUrl && (
              <img src={stream.thumbnailUrl} alt={stream.title} className="mx-auto w-64 rounded-lg object-cover aspect-video" />
            )}
            <p className="text-2xl font-semibold">{stream.title}</p>
            {isScheduled ? (
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">Stream starts in</p>
                <Countdown scheduledAt={stream.scheduledAt!} />
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">You're not live yet. Start broadcasting from your browser.</p>
            )}
            <Button
              disabled={pending}
              onClick={() => startTransition(async () => {
                await goLive(stream.id);
                router.refresh();
              })}
            >
              {pending ? 'Starting…' : 'Go Live'}
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center space-y-4">
          {stream.thumbnailUrl && (
            <img src={stream.thumbnailUrl} alt={stream.title} className="mx-auto w-64 rounded-lg object-cover aspect-video" />
          )}
          <p className="text-2xl font-semibold">{stream.title}</p>
          {isScheduled ? (
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">Stream starts in</p>
              <Countdown scheduledAt={stream.scheduledAt!} />
              <p className="text-xs text-muted-foreground">by {stream.host.name}</p>
            </div>
          ) : (
            <p className="text-muted-foreground">Stream is offline</p>
          )}
        </div>
      </div>
    );
  }

  if (streamEnded) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-2xl font-semibold">{stream.title}</p>
          <p className="text-muted-foreground">Stream has ended</p>
        </div>
      </div>
    );
  }

  if (!token) return <Skeleton className="h-full w-full" />;

  return (
    <LiveKitRoom
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL!}
      connect={true}
      onDisconnected={async () => {
        if (isHost) {
          await endStream(stream.id);
          router.push('/');
        } else {
          setStreamEnded(true);
        }
      }}
      className="flex h-full overflow-hidden"
    >
      <RoomAudioRenderer />
      <RoomInner
        stream={stream}
        viewerUserId={viewerUserId}
        isHost={isHost}
        memberStatus={memberStatus}
        pendingRequests={pendingRequests}
        containerRef={containerRef}
        reactRef={reactRef}
        pending={pending}
        startTransition={startTransition}
        viewerCount={viewerCount}
        router={router}
      />
    </LiveKitRoom>
  );
}

function RoomInner({
  stream, viewerUserId, isHost, memberStatus, pendingRequests,
  containerRef, reactRef, pending, startTransition, viewerCount, router,
}: {
  stream: SafeStream;
  viewerUserId: string | null;
  isHost: boolean;
  memberStatus: MemberStatus;
  pendingRequests: SafePendingRequest[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  reactRef: React.MutableRefObject<((type: 'heart' | 'fire' | 'clap' | 'wow' | 'laugh') => void) | null>;
  pending: boolean;
  startTransition: (fn: () => Promise<void>) => void;
  viewerCount: number;
  router: ReturnType<typeof useRouter>;
}) {
  const { toggle: toggleMic } = useTrackToggle({ source: Track.Source.Microphone });

  useKeyboardShortcuts({
    onReaction: (type) => reactRef.current?.(type),
    onMuteToggle: toggleMic,
    containerRef,
    enabled: stream.isLive,
  });

  return (
    <div ref={containerRef} className="flex flex-1 overflow-hidden min-w-0">
      {/* Main video area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
          <div className="flex items-center gap-3">
            <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
            {(stream.recordingStatus === 'active' || stream.recordingStatus === 'starting') && (
              <Badge variant="outline" className="gap-1 text-xs text-red-500 border-red-500">
                <CircleIcon className="size-2 fill-red-500" />REC
              </Badge>
            )}
            <span className="font-medium text-sm">{stream.title}</span>
            <span className="hidden text-sm text-muted-foreground sm:block">
              by {stream.host.name}
            </span>
            {viewerCount > 0 && (
              <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
                <EyeIcon className="size-3" />
                {viewerCount.toLocaleString()}
              </span>
            )}
          </div>

          {viewerUserId && !isHost && (
            <div>
              {memberStatus === 'none' && (
                <Button size="sm" variant="outline" disabled={pending}
                  onClick={() => startTransition(async () => {
                    await requestToJoin(stream.id);
                    router.refresh();
                  })}>
                  Request to join
                </Button>
              )}
              {memberStatus === 'pending' && (
                <Badge variant="secondary" className="text-xs">Request pending…</Badge>
              )}
              {memberStatus === 'rejected' && (
                <Badge variant="outline" className="text-xs">Request declined</Badge>
              )}
            </div>
          )}
        </div>

        {/* Video stage */}
        <div className="relative flex-1 overflow-hidden">
          <VideoStage isViewer={!isHost && memberStatus !== 'accepted'} />
          <ReactionsOverlay streamId={stream.id} userId={viewerUserId} reactRef={reactRef} />
        </div>

        {/* Controls */}
        <div className="shrink-0 border-t bg-background px-4 py-2">
          <StreamControls
            isHost={isHost}
            isParticipant={memberStatus === 'accepted'}
            streamId={stream.id}
            egressId={stream.egressId ?? null}
            recordingStatus={stream.recordingStatus ?? null}
            showClip={!!viewerUserId}
          />
        </div>
      </div>

      {/* Right sidebar: join requests (host) + participants + chat */}
      <div className="flex w-72 shrink-0 flex-col border-l">
        {isHost && pendingRequests.length > 0 && (
          <JoinRequestsPanel requests={pendingRequests} streamId={stream.id} />
        )}
        {isHost && <ParticipantsPanel streamId={stream.id} />}
        <PollPanel userId={viewerUserId} isHost={isHost} />
        <div className="flex h-12 shrink-0 items-center border-b px-4 text-sm font-medium">
          Chat
        </div>
        <StreamChat chatSettings={stream.chatSettings} memberStatus={memberStatus} />
      </div>
    </div>
  );
}

function JoinRequestsPanel({
  requests,
  streamId,
}: {
  requests: SafePendingRequest[];
  streamId: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handle(memberId: string, status: 'accepted' | 'rejected') {
    startTransition(async () => {
      await handleJoinRequest(memberId, streamId, status);
      router.refresh();
    });
  }

  return (
    <div className="shrink-0 border-b">
      <div className="flex h-10 items-center justify-between px-4">
        <span className="text-xs font-medium">Join requests</span>
        <Badge variant="destructive" className="text-[10px] px-1.5">{requests.length}</Badge>
      </div>
      <div className="flex flex-col gap-1 px-3 pb-2">
        {requests.map((req) => (
          <div key={req.id} className="flex items-center justify-between gap-2">
            <span className="text-xs truncate flex-1">{req.user.name}</span>
            <div className="flex gap-1">
              <Button
                size="icon" variant="outline"
                className="size-6"
                disabled={pending}
                onClick={() => handle(req.id, 'accepted')}
              >
                <CheckIcon className="size-3" />
              </Button>
              <Button
                size="icon" variant="ghost"
                className="size-6 text-muted-foreground"
                disabled={pending}
                onClick={() => handle(req.id, 'rejected')}
              >
                <XIcon className="size-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ParticipantsPanel({ streamId }: { streamId: string }) {
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const [pending, startTransition] = useTransition();

  const managed = participants.filter(
    (p) => p.identity !== localParticipant.identity && !p.identity.startsWith('anon-'),
  );

  if (managed.length === 0) return null;

  return (
    <div className="shrink-0 border-b">
      <div className="flex h-10 items-center justify-between px-4">
        <span className="text-xs font-medium">Participants</span>
        <span className="text-xs text-muted-foreground">{managed.length}</span>
      </div>
      <div className="flex flex-col gap-1 px-3 pb-2">
        {managed.map((p) => (
          <div key={p.identity} className="flex items-center justify-between gap-2">
            <span className="text-xs truncate flex-1">{p.name ?? p.identity}</span>
            <div className="flex gap-1">
              <Button
                size="icon" variant="outline" className="size-6"
                disabled={pending}
                title="Kick"
                onClick={() => startTransition(() => kickParticipant(streamId, p.identity))}
              >
                <UserMinusIcon className="size-3" />
              </Button>
              <Button
                size="icon" variant="destructive" className="size-6"
                disabled={pending}
                title="Ban"
                onClick={() => startTransition(() => banParticipant(streamId, p.identity))}
              >
                <BanIcon className="size-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VideoStage({ isViewer }: { isViewer: boolean }) {
  const { localParticipant } = useLocalParticipant();
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
      { source: Track.Source.ScreenShareAudio, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  const visualTracks = tracks.filter((t) => {
    if (t.source === Track.Source.ScreenShareAudio) return false;
    if (isViewer && t.participant.identity === localParticipant.identity) return false;
    return true;
  });

  return (
    <GridLayout tracks={visualTracks} style={{ height: '100%' }}>
      <ParticipantTile />
    </GridLayout>
  );
}

function StreamChat({ chatSettings, memberStatus }: { chatSettings: ChatSettings | null; memberStatus: MemberStatus }) {
  const { chatMessages, send } = useChat();
  const [text, setText] = useState('');
  const [chatError, setChatError] = useState<string | null>(null);
  const [slowCooldown, setSlowCooldown] = useState(0);
  const lastSentAt = useRef<number>(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Slow mode countdown ticker
  useEffect(() => {
    if (slowCooldown <= 0) return;
    const t = setTimeout(() => setSlowCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [slowCooldown]);

  const isFollowersOnly = chatSettings?.followersOnly ?? false;
  const canChat = !isFollowersOnly || memberStatus === 'accepted';

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || !send) return;
    setChatError(null);

    if (!canChat) {
      setChatError('Followers only');
      return;
    }

    if (chatSettings?.slowModeSeconds && lastSentAt.current) {
      const elapsed = (Date.now() - lastSentAt.current) / 1000;
      if (elapsed < chatSettings.slowModeSeconds) {
        const remaining = Math.ceil(chatSettings.slowModeSeconds - elapsed);
        setSlowCooldown(remaining);
        return;
      }
    }

    if (chatSettings?.wordFilters?.length) {
      const lower = trimmed.toLowerCase();
      const hit = chatSettings.wordFilters.find((w) => lower.includes(w.toLowerCase()));
      if (hit) {
        setChatError('Message contains a filtered word.');
        return;
      }
    }

    send(trimmed);
    lastSentAt.current = Date.now();
    setText('');
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ScrollArea className="flex-1 px-3 py-2">
        <div className="flex flex-col gap-2">
          {chatMessages.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-4">No messages yet</p>
          )}
          {chatMessages.map((msg) => (
            <div key={msg.id} className="flex flex-col gap-0.5">
              <span className="text-xs font-medium text-muted-foreground truncate">
                {msg.from?.name ?? 'Anonymous'}
              </span>
              <span className="text-sm break-words">{msg.message}</span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      <div className="shrink-0 border-t p-2 space-y-1">
        {chatError && <p className="text-[10px] text-destructive px-1">{chatError}</p>}
        {isFollowersOnly && !canChat && (
          <p className="text-[10px] text-muted-foreground px-1">Followers only — request to join to chat</p>
        )}
        <div className="flex gap-2">
          <Input
            className="h-8 text-sm"
            placeholder={isFollowersOnly && !canChat ? 'Followers only' : 'Say something…'}
            value={text}
            disabled={!canChat}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSend(); } }}
          />
          <Button
            size="sm"
            className="h-8 px-3 shrink-0"
            onClick={handleSend}
            disabled={!text.trim() || !canChat || slowCooldown > 0}
          >
            {slowCooldown > 0 ? `${slowCooldown}s` : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function StreamControls({ isHost, isParticipant, streamId, egressId, recordingStatus, showClip }: {
  isHost: boolean;
  isParticipant: boolean;
  streamId: string;
  egressId: string | null;
  recordingStatus: string | null;
  showClip?: boolean;
}) {
  const canPublish = isHost || isParticipant;
  const [recPending, startRecTransition] = useTransition();
  const isRecording = !!egressId || recordingStatus === 'active' || recordingStatus === 'starting';

  const { toggle: toggleMic, enabled: micEnabled, pending: micPending } = useTrackToggle({ source: Track.Source.Microphone });
  const { toggle: toggleCam, enabled: camEnabled, pending: camPending } = useTrackToggle({ source: Track.Source.Camera });
  const { toggle: toggleScreen, enabled: screenEnabled, pending: screenPending } = useTrackToggle({ source: Track.Source.ScreenShare });
  const { buttonProps: disconnectProps } = useDisconnectButton({ stopTracks: true });

  return (
    <div className="flex items-center justify-center gap-2">
      {canPublish && (
        <>
          <Button
            size="sm"
            variant={micEnabled ? 'outline' : 'destructive'}
            className="gap-1.5"
            disabled={micPending}
            onClick={() => toggleMic()}
          >
            {micEnabled ? <MicIcon className="size-4" /> : <MicOffIcon className="size-4" />}
            <span className="hidden sm:inline">{micEnabled ? 'Mute' : 'Unmuted'}</span>
          </Button>

          {isHost && (
            <>
              <Button
                size="sm"
                variant={camEnabled ? 'outline' : 'destructive'}
                className="gap-1.5"
                disabled={camPending}
                onClick={() => toggleCam()}
              >
                {camEnabled ? <CameraIcon className="size-4" /> : <CameraOffIcon className="size-4" />}
                <span className="hidden sm:inline">{camEnabled ? 'Stop cam' : 'Cam off'}</span>
              </Button>

              <Button
                size="sm"
                variant={screenEnabled ? 'secondary' : 'outline'}
                className="gap-1.5"
                disabled={screenPending}
                onClick={() => toggleScreen()}
              >
                {screenEnabled ? <MonitorOffIcon className="size-4" /> : <MonitorUpIcon className="size-4" />}
                <span className="hidden sm:inline">{screenEnabled ? 'Stop share' : 'Share screen'}</span>
              </Button>

              <Button
                size="sm"
                variant={isRecording ? 'destructive' : 'outline'}
                className="gap-1.5"
                disabled={recPending || recordingStatus === 'ending'}
                onClick={() => startRecTransition(async () => {
                  if (isRecording) await stopRecording(streamId);
                  else await startRecording(streamId);
                })}
              >
                {isRecording
                  ? <><CircleStopIcon className="size-4" /><span className="hidden sm:inline">{recPending ? 'Stopping…' : 'Stop Rec'}</span></>
                  : <><CircleIcon className="size-4 fill-red-500 text-red-500" /><span className="hidden sm:inline">{recPending ? 'Starting…' : 'Record'}</span></>
                }
              </Button>
            </>
          )}
        </>
      )}

      {showClip && <ClipButton streamId={streamId} />}

      <Button
        size="sm" variant="destructive"
        className="gap-1.5 ml-auto"
        onClick={disconnectProps.onClick}
      >
        <PhoneOffIcon className="size-4" />
        <span className="hidden sm:inline">Leave</span>
      </Button>
    </div>
  );
}
