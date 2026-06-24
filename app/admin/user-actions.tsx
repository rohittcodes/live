'use client';

import { useTransition } from 'react';
import { ShieldIcon, ShieldOffIcon, BanIcon, CheckCircleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function UserActions({
  userId,
  role,
  isBanned,
  isSelf,
}: {
  userId: string;
  role: string;
  isBanned: boolean;
  isSelf: boolean;
}) {
  const [pending, startTransition] = useTransition();

  async function patch(body: object) {
    startTransition(async () => {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...body }),
      });
      window.location.reload();
    });
  }

  if (isSelf) {
    return <Badge variant="default" className="text-[10px]">admin (you)</Badge>;
  }

  return (
    <div className="flex items-center gap-1 justify-end">
      {isBanned ? (
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-xs text-green-600 border-green-600 hover:bg-green-50"
          disabled={pending}
          onClick={() => patch({ isBanned: false })}
        >
          <CheckCircleIcon className="size-3" />
          Unban
        </Button>
      ) : (
        <>
          {role === 'user' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              disabled={pending}
              onClick={() => patch({ role: 'admin' })}
            >
              <ShieldIcon className="size-3" />
              Promote
            </Button>
          )}
          {role === 'admin' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs text-muted-foreground"
              disabled={pending}
              onClick={() => patch({ role: 'user' })}
            >
              <ShieldOffIcon className="size-3" />
              Demote
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs text-destructive hover:text-destructive"
            disabled={pending}
            onClick={() => patch({ isBanned: true })}
          >
            <BanIcon className="size-3" />
            Ban
          </Button>
        </>
      )}
    </div>
  );
}
