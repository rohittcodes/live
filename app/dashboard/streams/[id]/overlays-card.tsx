'use client';

import { useState } from 'react';
import { CopyIcon, CheckIcon, ExternalLinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function CopyInput({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex gap-2">
        <Input value={value} readOnly className="font-mono text-xs" />
        <Button variant="outline" size="icon" className="size-8 shrink-0" onClick={copy}>
          {copied ? <CheckIcon className="size-3.5 text-green-500" /> : <CopyIcon className="size-3.5" />}
        </Button>
        <Button variant="outline" size="icon" className="size-8 shrink-0" asChild>
          <a href={value} target="_blank" rel="noopener noreferrer">
            <ExternalLinkIcon className="size-3.5" />
          </a>
        </Button>
      </div>
    </div>
  );
}

export function OverlaysCard({
  streamId,
  roomName,
}: {
  streamId: string;
  roomName: string;
}) {
  const [chatUrl, setChatUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const base = typeof window !== 'undefined' ? window.location.origin : '';
  const viewersUrl = `${base}/overlay/${streamId}/viewers`;

  async function generateChatUrl() {
    setLoading(true);
    const res = await fetch(`/api/livekit/token?room=${roomName}&type=viewer`);
    const { token } = await res.json();
    setChatUrl(`${base}/overlay/${streamId}/chat?room=${roomName}&token=${token}`);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <CopyInput value={viewersUrl} label="Viewer Count Widget" />

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Chat Overlay</Label>
        {chatUrl ? (
          <div className="flex gap-2">
            <Input value={chatUrl} readOnly className="font-mono text-xs" />
            <Button variant="outline" size="icon" className="size-8 shrink-0"
              onClick={() => { navigator.clipboard.writeText(chatUrl); }}>
              <CopyIcon className="size-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="size-8 shrink-0" asChild>
              <a href={chatUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLinkIcon className="size-3.5" />
              </a>
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" disabled={loading} onClick={generateChatUrl}>
            {loading ? 'Generating…' : 'Generate chat overlay URL'}
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Add these as <strong>Browser Source</strong> in OBS. Set width to 400 and height to 80 (viewer count) or 500 (chat).
      </p>
    </div>
  );
}
