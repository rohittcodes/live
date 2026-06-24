'use client';

import { useState, useTransition } from 'react';
import { BookmarkIcon, SaveIcon, PencilIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { saveClipsAsChapters } from './chapter-actions';
import type { StreamClip } from '@/lib/db/schema';

function formatTs(unixSeconds: number) {
  const d = new Date(unixSeconds * 1000);
  return d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function ClipsPanel({
  clips,
  videoId,
}: {
  clips: StreamClip[];
  videoId: string | null;
}) {
  const [labels, setLabels] = useState<Record<string, string>>(
    Object.fromEntries(clips.map((c) => [c.id, c.label ?? ''])),
  );
  const [editing, setEditing] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  if (clips.length === 0) return null;

  function saveChapters() {
    if (!videoId) return;
    const chapters = clips.map((c) => ({
      clipId: c.id,
      timestampSeconds: c.timestampSeconds,
      title: labels[c.id] || formatTs(c.timestampSeconds),
    }));
    startTransition(async () => {
      await saveClipsAsChapters(videoId!, chapters);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{clips.length} bookmark{clips.length !== 1 ? 's' : ''}</span>
        {videoId && (
          <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" disabled={pending} onClick={saveChapters}>
            <SaveIcon className="size-3" />
            {saved ? 'Saved!' : pending ? 'Saving…' : 'Save as chapters'}
          </Button>
        )}
      </div>

      <div className="space-y-1">
        {clips.map((clip) => (
          <div key={clip.id} className="flex items-center gap-2 rounded border px-3 py-1.5">
            <BookmarkIcon className="size-3 shrink-0 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-mono w-20 shrink-0">
              {formatTs(clip.timestampSeconds)}
            </span>
            {editing === clip.id ? (
              <Input
                className="h-6 text-xs flex-1"
                value={labels[clip.id]}
                autoFocus
                onChange={(e) => setLabels({ ...labels, [clip.id]: e.target.value })}
                onBlur={() => setEditing(null)}
                onKeyDown={(e) => e.key === 'Enter' && setEditing(null)}
              />
            ) : (
              <span className="text-xs flex-1 truncate">
                {labels[clip.id] || <span className="text-muted-foreground italic">unlabelled</span>}
              </span>
            )}
            <button
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setEditing(clip.id)}
            >
              <PencilIcon className="size-3" />
            </button>
          </div>
        ))}
      </div>

      {!videoId && (
        <p className="text-xs text-muted-foreground">Recording not available yet. Chapters can be saved once the recording finishes.</p>
      )}
    </div>
  );
}
