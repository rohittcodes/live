'use client';

import { useState, useTransition } from 'react';
import { PlusIcon, TrashIcon, BarChart3Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { createPoll } from '@/app/stream/[id]/poll-actions';

export function CreatePollDialog({ streamId }: { streamId: string }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function addOption() {
    if (options.length < 4) setOptions([...options, '']);
  }

  function removeOption(i: number) {
    if (options.length <= 2) return;
    setOptions(options.filter((_, idx) => idx !== i));
  }

  function submit() {
    setError(null);
    const q = question.trim();
    const opts = options.map((o) => o.trim()).filter(Boolean);
    if (!q) return setError('Question is required.');
    if (opts.length < 2) return setError('At least 2 options required.');

    startTransition(async () => {
      try {
        await createPoll(streamId, q, opts);
        setOpen(false);
        setQuestion('');
        setOptions(['', '']);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to create poll.');
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <BarChart3Icon className="size-3.5" />
          Create Poll
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Create Poll</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Question</Label>
            <Input
              placeholder="Ask your audience…"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Options</Label>
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  placeholder={`Option ${i + 1}`}
                  value={opt}
                  onChange={(e) => {
                    const next = [...options];
                    next[i] = e.target.value;
                    setOptions(next);
                  }}
                />
                {options.length > 2 && (
                  <Button variant="ghost" size="icon" className="size-9 shrink-0"
                    onClick={() => removeOption(i)}>
                    <TrashIcon className="size-3.5" />
                  </Button>
                )}
              </div>
            ))}
            {options.length < 4 && (
              <Button variant="ghost" size="sm" className="gap-1" onClick={addOption}>
                <PlusIcon className="size-3.5" />
                Add option
              </Button>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button className="w-full" disabled={pending} onClick={submit}>
            {pending ? 'Creating…' : 'Launch Poll'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
