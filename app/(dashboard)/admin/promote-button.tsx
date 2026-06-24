'use client';

import { useTransition } from 'react';
import { ShieldIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

export function PromoteButton({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition();

  function promote() {
    startTransition(async () => {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: 'admin' }),
      });
      window.location.reload();
    });
  }

  return (
    <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={promote} disabled={pending}>
      {pending ? <Spinner className="size-3" /> : <><ShieldIcon className="size-3" />Promote</>}
    </Button>
  );
}
