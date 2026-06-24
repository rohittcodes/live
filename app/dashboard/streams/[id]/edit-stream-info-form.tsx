'use client';

import { useState, useTransition } from 'react';
import { PencilIcon, CheckIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateStreamInfo } from './actions';

export function EditStreamInfoForm({
  streamId,
  title,
  category,
}: {
  streamId: string;
  title: string;
  category: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [titleVal, setTitleVal] = useState(title);
  const [categoryVal, setCategoryVal] = useState(category ?? '');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function cancel() {
    setTitleVal(title);
    setCategoryVal(category ?? '');
    setEditing(false);
    setError(null);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      try {
        await updateStreamInfo(streamId, {
          title: titleVal,
          category: categoryVal.trim() || null,
        });
        setEditing(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save');
      }
    });
  }

  if (!editing) {
    return (
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{title}</h1>
          {category && <p className="text-sm text-muted-foreground">{category}</p>}
        </div>
        <Button variant="ghost" size="icon" className="shrink-0 mt-0.5" onClick={() => setEditing(true)}>
          <PencilIcon className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Input
        value={titleVal}
        onChange={(e) => setTitleVal(e.target.value)}
        maxLength={120}
        placeholder="Stream title"
        className="text-base font-semibold"
        autoFocus
      />
      <Input
        value={categoryVal}
        onChange={(e) => setCategoryVal(e.target.value)}
        placeholder="Category (optional)"
        className="text-sm"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={pending || !titleVal.trim()}>
          <CheckIcon className="size-3.5 mr-1" />
          {pending ? 'Saving…' : 'Save'}
        </Button>
        <Button size="sm" variant="ghost" onClick={cancel} disabled={pending}>
          <XIcon className="size-3.5 mr-1" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
