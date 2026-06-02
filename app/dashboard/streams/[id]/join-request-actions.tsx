'use client';

import { useTransition } from 'react';
import { CheckIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { handleJoinRequest } from './actions';

export function JoinRequestActions({ memberId, streamId }: { memberId: string; streamId: string }) {
  const [pending, startTransition] = useTransition();

  function handle(status: 'accepted' | 'rejected') {
    startTransition(async () => { await handleJoinRequest(memberId, streamId, status); });
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" disabled={pending} onClick={() => handle('accepted')}>
        <CheckIcon className="size-3" /> Accept
      </Button>
      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground" disabled={pending} onClick={() => handle('rejected')}>
        <XIcon className="size-3" /> Reject
      </Button>
    </div>
  );
}
