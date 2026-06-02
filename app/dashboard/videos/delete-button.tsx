'use client';

import { useTransition } from 'react';
import { Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteVideo } from './actions';

export function DeleteVideoButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost" size="sm"
      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
      disabled={pending}
      onClick={() => {
        if (!confirm('Delete this video? This cannot be undone.')) return;
        startTransition(async () => { await deleteVideo(id); });
      }}
    >
      <Trash2Icon className="size-3.5" />
    </Button>
  );
}
