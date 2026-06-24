'use client';

import { useState, useTransition } from 'react';
import { UserPlusIcon, UserCheckIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FollowButton({
  followingId,
  initialIsFollowing,
  initialCount,
}: {
  followingId: string;
  initialIsFollowing: boolean;
  initialCount: number;
}) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [count, setCount] = useState(initialCount);
  const [, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const method = isFollowing ? 'DELETE' : 'POST';
      const res = await fetch('/api/follow', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followingId }),
      });
      if (res.ok) {
        const data = await res.json() as { following: boolean; followerCount: number };
        setIsFollowing(data.following);
        setCount(data.followerCount);
      }
    });
  }

  return (
    <Button
      variant={isFollowing ? 'secondary' : 'default'}
      size="sm"
      className="gap-1.5"
      onClick={toggle}
    >
      {isFollowing
        ? <><UserCheckIcon className="size-3.5" /> Following</>
        : <><UserPlusIcon className="size-3.5" /> Follow</>
      }
      {count > 0 && (
        <span className="ml-1 text-xs opacity-70">{count.toLocaleString()}</span>
      )}
    </Button>
  );
}
