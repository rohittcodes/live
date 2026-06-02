'use client';

import { useState } from 'react';
import { CopyIcon, CheckIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function StreamCredentials({ serverUrl, streamKey }: { serverUrl: string; streamKey: string }) {
  const [copied, setCopied] = useState<'url' | 'key' | null>(null);
  const [showKey, setShowKey] = useState(false);

  function copy(text: string, field: 'url' | 'key') {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">RTMP Server URL</Label>
        <div className="flex gap-2">
          <Input value={serverUrl} readOnly className="font-mono text-xs" />
          <Button variant="outline" size="sm" className="shrink-0" onClick={() => copy(serverUrl, 'url')}>
            {copied === 'url' ? <CheckIcon className="size-3.5 text-green-500" /> : <CopyIcon className="size-3.5" />}
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Stream Key</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={showKey ? streamKey : '••••••••••••••••'}
              readOnly
              className="font-mono text-xs pr-9"
            />
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowKey((v) => !v)}
              type="button"
            >
              {showKey ? <EyeOffIcon className="size-3.5" /> : <EyeIcon className="size-3.5" />}
            </button>
          </div>
          <Button variant="outline" size="sm" className="shrink-0" onClick={() => copy(streamKey, 'key')}>
            {copied === 'key' ? <CheckIcon className="size-3.5 text-green-500" /> : <CopyIcon className="size-3.5" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Keep this secret. Anyone with this key can stream to your channel.</p>
      </div>
    </div>
  );
}
