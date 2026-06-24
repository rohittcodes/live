'use client';

import { useTransition } from 'react';
import { BanIcon, UserXIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { unbanUser } from './actions';

type Ban = {
  id: string;
  userId: string;
  createdAt: Date;
  user: { name: string; imageUrl: string | null; username: string | null };
};

export function StreamBansPanel({ bans, streamId }: { bans: Ban[]; streamId: string }) {
  const [pending, startTransition] = useTransition();

  if (bans.length === 0) return null;

  return (
    <Card>
      <CardHeader className="px-4 py-3">
        <div className="flex items-center gap-2">
          <BanIcon className="size-4 text-destructive" />
          <CardTitle className="text-sm font-semibold">Banned Viewers</CardTitle>
        </div>
        <CardDescription className="text-xs">{bans.length} user{bans.length !== 1 ? 's' : ''} banned from this stream.</CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="p-0">
        {bans.map((ban, i) => {
          const initials = ban.user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
          return (
            <div key={ban.id}>
              <div className="flex items-center gap-3 px-4 py-3">
                <Avatar className="size-8">
                  {ban.user.imageUrl && <img src={ban.user.imageUrl} alt={ban.user.name} />}
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">{ban.user.name}</span>
                  {ban.user.username && (
                    <span className="truncate text-xs text-muted-foreground">@{ban.user.username}</span>
                  )}
                </div>
                <span className="hidden text-xs text-muted-foreground sm:block shrink-0">
                  {new Date(ban.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-xs shrink-0"
                  disabled={pending}
                  onClick={() => startTransition(() => unbanUser(streamId, ban.userId))}
                >
                  <UserXIcon className="size-3" />
                  Unban
                </Button>
              </div>
              {i < bans.length - 1 && <Separator />}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
