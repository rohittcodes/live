'use client';

import { useTransition } from 'react';
import { Switch } from '@/components/ui/switch';
import { togglePublishPost } from './actions';

export function PublishPostToggle({ id, published }: { id: string; published: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <Switch
      checked={published}
      disabled={pending}
      onCheckedChange={(val) => {
        startTransition(async () => { await togglePublishPost(id, val); });
      }}
    />
  );
}
