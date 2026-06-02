'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  LiveKitRoom,
  AudioConference,
  ControlBar,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { PlayIcon, CircleStopIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { startRoom, endRoom } from './room-actions';
import type { AudioRoom as AudioRoomType, User } from '@/lib/db/schema';

type Props = {
  room: AudioRoomType & { host: User };
  type: 'host' | 'participant' | 'viewer';
};

export function AudioRoom({ room, type }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (type === 'viewer') return;
    fetch(`/api/livekit/token?room=${room.livekitRoomName}&type=${type === 'host' ? 'host' : 'participant'}`)
      .then((r) => r.json())
      .then((d) => setToken(d.token));
  }, [room.livekitRoomName, type]);

  if (room.status === 'ended') {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-2xl font-semibold">{room.title}</p>
          <p className="text-muted-foreground">This audio room has ended</p>
          {room.recordingUrl && (
            <a href={room.recordingUrl} className="text-sm text-primary underline">Listen to recording</a>
          )}
        </div>
      </div>
    );
  }

  const header = (
    <div className="flex items-center justify-between border-b px-4 py-2">
      <div className="flex items-center gap-3">
        <Badge
          variant={room.status === 'active' ? 'destructive' : 'secondary'}
          className={room.status === 'active' ? 'animate-pulse' : ''}
        >
          {room.status === 'active' ? 'LIVE' : 'SCHEDULED'}
        </Badge>
        <span className="font-medium">{room.title}</span>
        <span className="text-sm text-muted-foreground">hosted by {room.host.name}</span>
      </div>

      {/* Host controls */}
      {type === 'host' && (
        <div className="flex gap-2">
          {room.status === 'scheduled' && (
            <Button size="sm" disabled={pending} onClick={() => startTransition(() => startRoom(room.id))}>
              <PlayIcon className="mr-1.5 size-3.5" />
              {pending ? 'Starting…' : 'Start Room'}
            </Button>
          )}
          {room.status === 'active' && (
            <Button size="sm" variant="destructive" disabled={pending}
              onClick={() => { if (confirm('End this room for everyone?')) startTransition(() => endRoom(room.id)); }}>
              <CircleStopIcon className="mr-1.5 size-3.5" />
              {pending ? 'Ending…' : 'End Room'}
            </Button>
          )}
        </div>
      )}
    </div>
  );

  // Non-participant viewer (unauthenticated / not yet accepted)
  if (type === 'viewer') {
    return (
      <div className="flex h-full flex-col">
        {header}
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground text-sm">
            {room.status === 'scheduled' ? 'Room hasn\'t started yet.' : 'You are viewing as a guest.'}
          </p>
        </div>
      </div>
    );
  }

  if (!token) return <Skeleton className="h-screen w-full" />;

  return (
    <div className="flex h-full flex-col">
      {header}
      <LiveKitRoom
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL!}
        connect={room.status === 'active'}
        audio={true}
        video={false}
        className="flex-1"
      >
        <AudioConference className="flex-1" />
        <ControlBar
          controls={{ camera: false, screenShare: false, microphone: true, chat: true, leave: true }}
        />
      </LiveKitRoom>
    </div>
  );
}
