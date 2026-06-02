'use client';

import { useTransition } from 'react';
import { CircleIcon, CircleStopIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { startRecording, stopRecording } from './recording-actions';

type Props = {
  streamId: string;
  egressId: string | null;
  recordingStatus: string | null;
};

export function RecordingButton({ streamId, egressId, recordingStatus }: Props) {
  const [pending, startTransition] = useTransition();
  const isRecording = !!egressId || recordingStatus === 'active' || recordingStatus === 'starting';
  const isStopping = recordingStatus === 'ending';

  if (isStopping) {
    return <Badge variant="secondary" className="text-xs">Saving recording…</Badge>;
  }

  return (
    <Button
      size="sm"
      variant={isRecording ? 'destructive' : 'outline'}
      disabled={pending}
      onClick={() => startTransition(async () => {
        if (isRecording) await stopRecording(streamId);
        else await startRecording(streamId);
      })}
    >
      {isRecording
        ? <><CircleStopIcon className="mr-1.5 size-3.5" />{pending ? 'Stopping…' : 'Stop Recording'}</>
        : <><CircleIcon className="mr-1.5 size-3.5 fill-red-500 text-red-500" />{pending ? 'Starting…' : 'Record'}</>
      }
    </Button>
  );
}
