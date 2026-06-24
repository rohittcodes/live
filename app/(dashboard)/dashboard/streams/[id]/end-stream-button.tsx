'use client';

import { useTransition } from 'react';
import { CircleStopIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { endStream } from '../actions';

export function EndStreamButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm('End this stream and disconnect all viewers?')) return;
        startTransition(async () => { await endStream(id); });
      }}
    >
      <CircleStopIcon className="mr-1.5 size-3.5" />
      {pending ? 'Ending…' : 'End Stream'}
    </Button>
  );
}
