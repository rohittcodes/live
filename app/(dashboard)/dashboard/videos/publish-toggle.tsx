'use client';

import { useTransition } from 'react';
import { Switch } from '@/components/ui/switch';
import { togglePublish } from './actions';

export function PublishToggle({ id, published, disabled }: { id: string; published: boolean; disabled: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <Switch
      checked={published}
      disabled={disabled || pending}
      onCheckedChange={(v) => startTransition(async () => { await togglePublish(id, v); })}
    />
  );
}
