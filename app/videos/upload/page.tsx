'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UploadIcon, FileVideoIcon, CheckCircleIcon, ImageIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CATEGORIES = ['Gaming', 'Coding', 'Music', 'Talk', 'Education', 'Art', 'Sports', 'Other'];
type Stage = 'form' | 'uploading' | 'done';

export default function VideoUploadPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [language, setLanguage] = useState('en');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [thumbUploading, setThumbUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<Stage>('form');
  const [error, setError] = useState('');

  function addTag(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const t = tagInput.trim().toLowerCase();
      if (t && !tags.includes(t) && tags.length < 10) { setTags([...tags, t]); setTagInput(''); }
    }
  }

  async function uploadThumbnail(f: File) {
    setThumbUploading(true);
    const form = new FormData();
    form.append('file', f);
    const res = await fetch('/api/cloudflare/thumbnail', { method: 'POST', body: form });
    const { url } = await res.json();
    if (url) setThumbnail(url);
    setThumbUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return setError('Please select a video file.');
    if (!title.trim()) return setError('Title is required.');
    setError(''); setStage('uploading');

    const res = await fetch('/api/cloudflare/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, category, language, tags, thumbnailUrl: thumbnail, fileSize: file.size }),
    });

    if (!res.ok) { const { error } = await res.json(); setError(error ?? 'Failed to initiate upload.'); setStage('form'); return; }
    const { uploadUrl } = await res.json();

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PATCH', uploadUrl);
      xhr.setRequestHeader('Content-Type', 'application/offset+octet-stream');
      xhr.setRequestHeader('Upload-Offset', '0');
      xhr.setRequestHeader('Tus-Resumable', '1.0.0');
      xhr.upload.onprogress = (e) => { if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100)); };
      xhr.onload = () => xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`));
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.send(file);
    }).catch((err) => { setError(err.message); setStage('form'); throw err; });

    setStage('done');
  }

  if (stage === 'done') {
    return (
      <div className="w-full p-4 max-w-lg">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <CheckCircleIcon className="size-10 text-green-500" />
            <div className="text-center">
              <p className="font-semibold">Upload complete</p>
              <p className="text-sm text-muted-foreground mt-1">Cloudflare is processing your video. It'll appear once ready.</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => router.push('/dashboard/videos')}>Back to Videos</Button>
              <Button size="sm" onClick={() => { setStage('form'); setFile(null); setTitle(''); setProgress(0); }}>Upload Another</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full p-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Main form */}
        <Card>
          <CardHeader className="px-4 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <UploadIcon className="size-4 text-muted-foreground" />
              <CardTitle className="text-base">Upload Video</CardTitle>
            </div>
            <CardDescription>Videos are processed by Cloudflare Stream after upload.</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* File picker */}
              <div
                className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border p-8 cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <FileVideoIcon className="size-8 text-muted-foreground" />
                {file ? (
                  <div className="text-center">
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Click to select a video file</p>
                )}
                <input ref={fileRef} type="file" accept="video/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); if (!title) setTitle(f.name.replace(/\.[^.]+$/, '')); } }} />
              </div>

              <div className="space-y-1.5">
                <Label>Title <span className="text-destructive">*</span></Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Video title" required />
              </div>

              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this video about?" rows={3} />
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
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Tags <span className="text-muted-foreground text-xs">(press Enter, max 10)</span></Label>
                <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={addTag} placeholder="tutorial, react, webdev…" disabled={tags.length >= 10} />
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tags.map((t) => <Badge key={t} variant="secondary" className="gap-1 cursor-pointer" onClick={() => setTags(tags.filter((x) => x !== t))}>{t} ×</Badge>)}
                  </div>
                )}
              </div>

              {stage === 'uploading' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground"><span>Uploading…</span><span>{progress}%</span></div>
                  <Progress value={progress} className="h-1.5" />
                </div>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" disabled={stage === 'uploading' || !file} className="w-full">
                {stage === 'uploading' ? `Uploading ${progress}%…` : 'Upload'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Sidebar: thumbnail */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="text-sm font-semibold">Custom Thumbnail</CardTitle>
              <CardDescription className="text-xs">Overrides the auto-generated Cloudflare thumbnail.</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div
                className="aspect-video w-full rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden"
                onClick={() => thumbRef.current?.click()}
              >
                {thumbnail
                  ? <img src={thumbnail} alt="Thumbnail" className="h-full w-full object-cover" />
                  : <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ImageIcon className="size-8" />
                      <span className="text-xs">{thumbUploading ? 'Uploading…' : 'Click to upload'}</span>
                    </div>
                }
              </div>
              <input ref={thumbRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadThumbnail(f); }} />
              <p className="mt-2 text-xs text-muted-foreground">16:9 ratio recommended.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="text-sm font-semibold">Processing</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2 text-xs text-muted-foreground">
              <p>• Cloudflare Stream processes your video after upload (usually 1–5 min).</p>
              <p>• You can publish the video once status shows "Ready".</p>
              <p>• A thumbnail is auto-generated at the 1s mark if you don't upload one.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
