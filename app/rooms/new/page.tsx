'use client';

import { useActionState } from 'react';
import { MicIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createRoom, type CreateRoomResult } from './actions';

export default function NewRoomPage() {
  const [state, action, pending] = useActionState<CreateRoomResult | null, FormData>(createRoom, null);

  return (
    <div className="w-full p-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Main form */}
        <Card>
          <CardHeader className="px-4 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <MicIcon className="size-4 text-muted-foreground" />
              <CardTitle className="text-base">New Audio Room</CardTitle>
            </div>
            <CardDescription>Schedule or start a live audio conversation with your audience.</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <form action={action} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
                <Input id="title" name="title" placeholder="Room title" maxLength={120} required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="What will you discuss?" rows={3} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="scheduledAt">
                  Scheduled time <span className="text-muted-foreground text-xs">(optional — leave blank to start now)</span>
                </Label>
                <Input id="scheduledAt" name="scheduledAt" type="datetime-local" />
              </div>

              {state && 'error' in state && <p className="text-sm text-destructive">{state.error}</p>}

              <Button type="submit" disabled={pending} className="w-full">
                {pending ? 'Creating…' : 'Create Room'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="text-sm font-semibold">How it works</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2 text-xs text-muted-foreground">
              <p>• Audience members can listen and request to speak.</p>
              <p>• You control who can unmute and participate.</p>
              <p>• Schedule in advance to let your audience know when to join.</p>
              <p>• Optional recording saves the full session to Cloudflare R2.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
