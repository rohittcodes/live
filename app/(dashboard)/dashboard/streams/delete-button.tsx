'use client';

import { useTransition } from 'react';
import { Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteStream } from './actions';

export function DeleteStreamButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
      disabled={pending}
      onClick={() => {
        if (!confirm('Delete this stream? This cannot be undone.')) return;
        startTransition(async () => { await deleteStream(id); });
      }}
    >
      <Trash2Icon className="size-3.5" />
    </Button>
  );
}
