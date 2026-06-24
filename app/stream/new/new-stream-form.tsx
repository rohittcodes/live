'use client';

import { useActionState, useRef, useState } from 'react';
import { RadioIcon, ImageIcon, CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createStream, type CreateStreamResult } from './actions';

const CATEGORIES = ['Gaming', 'Coding', 'Music', 'Talk', 'Education', 'Art', 'Sports', 'Other'];

export function NewStreamForm() {
  const [state, action, pending] = useActionState<CreateStreamResult | null, FormData>(createStream, null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [thumbnail, setThumbnail] = useState<string>('');
  const [category, setCategory] = useState('');
  const [language, setLanguage] = useState('en');
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [scheduled, setScheduled] = useState(false);

  function addTag(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const t = tagInput.trim().toLowerCase();
      if (t && !tags.includes(t) && tags.length < 10) {
        setTags([...tags, t]);
        setTagInput('');
      }
    }
  }

  async function uploadThumbnail(file: File) {
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/cloudflare/thumbnail', { method: 'POST', body: form });
    const { url } = await res.json();
    if (url) setThumbnail(url);
    setUploading(false);
  }

  return (
    <div className="w-full p-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Main form */}
        <Card>
          <CardHeader className="px-4 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <RadioIcon className="size-4 text-muted-foreground" />
              <CardTitle className="text-base">New Stream</CardTitle>
            </div>
            <CardDescription>Set up your stream. You'll get RTMP credentials on the next screen.</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <form action={(fd) => {
              fd.append('tags', JSON.stringify(tags));
              fd.append('thumbnailUrl', thumbnail);
              fd.append('category', category);
              fd.append('language', language);
              action(fd);
            }} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
                <Input id="title" name="title" placeholder="What are you streaming?" maxLength={120} required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="Tell viewers what this stream is about…" rows={3} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category…" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                      <SelectItem value="ko">Korean</SelectItem>
                      <SelectItem value="pt">Portuguese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <Label>Tags <span className="text-muted-foreground text-xs">(press Enter to add, max 10)</span></Label>
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={addTag}
                  placeholder="gaming, irl, chill…"
                  disabled={tags.length >= 10}
                />
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tags.map((t) => (
                      <Badge key={t} variant="secondary" className="gap-1 cursor-pointer" onClick={() => setTags(tags.filter((x) => x !== t))}>
                        {t} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Schedule */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="schedule-toggle"
                    checked={scheduled}
                    onChange={(e) => setScheduled(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="schedule-toggle" className="flex items-center gap-1.5 cursor-pointer">
                    <CalendarIcon className="size-3.5 text-muted-foreground" />
                    Schedule for later
                  </Label>
                </div>
                {scheduled && (
                  <Input
                    type="datetime-local"
                    name="scheduledAt"
                    min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
                    required
                  />
                )}
              </div>

              {state && 'error' in state && <p className="text-sm text-destructive">{state.error}</p>}

              <Button type="submit" disabled={pending} className="w-full">
                {pending ? 'Creating…' : scheduled ? 'Schedule Stream' : 'Create Stream'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Sidebar: thumbnail + tips */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="text-sm font-semibold">Thumbnail</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div
                className="aspect-video w-full rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden"
                onClick={() => fileRef.current?.click()}
              >
                {thumbnail
                  ? <img src={thumbnail} alt="Thumbnail" className="h-full w-full object-cover" />
                  : <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ImageIcon className="size-8" />
                      <span className="text-xs">{uploading ? 'Uploading…' : 'Click to upload'}</span>
                    </div>
                }
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadThumbnail(f); }} />
              <p className="mt-2 text-xs text-muted-foreground">16:9 ratio recommended. JPEG, PNG, WebP.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="text-sm font-semibold">Tips</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2 text-xs text-muted-foreground">
              <p>• After creating, you'll get an RTMP URL and stream key to use in OBS or any encoder.</p>
              <p>• Tags help viewers discover your stream.</p>
              <p>• You can update all details after creation from the stream management page.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
