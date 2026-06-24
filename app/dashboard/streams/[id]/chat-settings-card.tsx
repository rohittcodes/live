'use client';

import { useState, useTransition } from 'react';
import { MessageSquareIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { updateChatSettings } from './actions';

type ChatSettings = {
  slowModeSeconds: number | null;
  followersOnly: boolean;
  wordFilters: string[];
};

export function ChatSettingsCard({
  streamId,
  initial,
}: {
  streamId: string;
  initial: ChatSettings;
}) {
  const [slowMode, setSlowMode] = useState(initial.slowModeSeconds !== null);
  const [slowSecs, setSlowSecs] = useState(initial.slowModeSeconds ?? 10);
  const [followersOnly, setFollowersOnly] = useState(initial.followersOnly);
  const [wordFilters, setWordFilters] = useState(initial.wordFilters.join('\n'));
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function save() {
    startTransition(async () => {
      await updateChatSettings(streamId, {
        slowModeSeconds: slowMode ? Math.max(1, Math.min(120, slowSecs)) : null,
        followersOnly,
        wordFilters: wordFilters
          .split('\n')
          .map((w) => w.trim().toLowerCase())
          .filter(Boolean),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="rounded-xl border p-5 space-y-4">
      <div className="flex items-center gap-2 font-semibold text-sm">
        <MessageSquareIcon className="size-4" />
        Chat Moderation
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Slow mode</Label>
            <p className="text-xs text-muted-foreground">Limit how often viewers can send messages</p>
          </div>
          <Switch checked={slowMode} onCheckedChange={setSlowMode} />
        </div>
        {slowMode && (
          <div className="flex items-center gap-2 pl-0">
            <Input
              type="number"
              min={1}
              max={120}
              value={slowSecs}
              onChange={(e) => setSlowSecs(Number(e.target.value))}
              className="w-20 h-8 text-sm"
            />
            <span className="text-sm text-muted-foreground">seconds between messages</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">Followers only</Label>
          <p className="text-xs text-muted-foreground">Only accepted members can chat</p>
        </div>
        <Switch checked={followersOnly} onCheckedChange={setFollowersOnly} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Word filters</Label>
        <p className="text-xs text-muted-foreground">One word or phrase per line — blocked in chat</p>
        <Textarea
          value={wordFilters}
          onChange={(e) => setWordFilters(e.target.value)}
          placeholder="badword&#10;another phrase"
          className="h-24 text-sm font-mono"
        />
      </div>

      <Button size="sm" onClick={save} disabled={pending}>
        {saved ? 'Saved!' : pending ? 'Saving…' : 'Save settings'}
      </Button>
    </div>
  );
}
