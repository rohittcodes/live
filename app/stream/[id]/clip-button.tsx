'use client';

import { useRef, useState, useTransition } from 'react';
import { BookmarkIcon, CheckIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { createClip } from './clip-actions';

export function ClipButton({ streamId }: { streamId: string }) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function save() {
    const label = inputRef.current?.value?.trim() || undefined;
    startTransition(async () => {
      await createClip(streamId, label);
      setSaved(true);
      setOpen(false);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          {saved
            ? <><CheckIcon className="size-4 text-green-500" /><span className="hidden sm:inline">Saved!</span></>
            : <><BookmarkIcon className="size-4" /><span className="hidden sm:inline">Clip</span></>
          }
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-3 space-y-2" side="top">
        <p className="text-xs font-medium">Bookmark this moment</p>
        <Input
          ref={inputRef}
          placeholder="Label (optional)"
          className="h-8 text-sm"
          onKeyDown={(e) => e.key === 'Enter' && save()}
        />
        <Button size="sm" className="w-full" disabled={pending} onClick={save}>
          {pending ? 'Saving…' : 'Save clip'}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
