'use client';

import { useTransition, useState, useRef } from 'react';
import { PlusIcon, ImagePlusIcon, XIcon, LoaderIcon } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { createPost } from './actions';

async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/cloudflare/thumbnail', { method: 'POST', body: fd });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Upload failed');
  }
  const { url } = await res.json();
  return url as string;
}

export function CreatePostDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState<'post' | 'announcement' | 'update'>('post');
  const [publish, setPublish] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploadError(null);
    setUploading(true);
    try {
      const urls = await Promise.all(files.map(uploadImage));
      setImageUrls((prev) => [...prev, ...urls]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function removeImage(url: string) {
    setImageUrls((prev) => prev.filter((u) => u !== url));
  }

  function reset() {
    setType('post');
    setPublish(false);
    setImageUrls([]);
    setUploadError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = (fd.get('title') as string).trim();
    const content = (fd.get('content') as string).trim();
    const tagsRaw = (fd.get('tags') as string).trim();
    const tags = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : [];

    if (!title || !content) return;

    startTransition(async () => {
      await createPost({ title, content, type, tags, imageUrls, publish });
      setOpen(false);
      reset();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon className="mr-1.5 size-4" />
          New Post
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Community Post</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" placeholder="Post title" required />
          </div>

          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="post">Post</SelectItem>
                <SelectItem value="announcement">Announcement</SelectItem>
                <SelectItem value="update">Update</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              name="content"
              placeholder="Write your post (markdown supported)..."
              rows={6}
              required
            />
          </div>

          {/* Image upload */}
          <div className="space-y-2">
            <Label>Images</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={handleImagePick}
            />
            {imageUrls.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {imageUrls.map((url) => (
                  <div key={url} className="relative group size-20 rounded-md overflow-hidden border">
                    <Image src={url} alt="" fill className="object-cover" sizes="80px" />
                    <button
                      type="button"
                      onClick={() => removeImage(url)}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XIcon className="size-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <><LoaderIcon className="mr-1.5 size-4 animate-spin" />Uploading…</>
              ) : (
                <><ImagePlusIcon className="mr-1.5 size-4" />Add Images</>
              )}
            </Button>
            {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags <span className="text-muted-foreground text-xs">(comma-separated)</span></Label>
            <Input id="tags" name="tags" placeholder="news, feature, release" />
          </div>

          <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <div>
              <p className="text-sm font-medium">Publish immediately</p>
              <p className="text-xs text-muted-foreground">Visible to all users right away</p>
            </div>
            <Switch checked={publish} onCheckedChange={setPublish} />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={pending || uploading}>
              {pending ? 'Saving…' : publish ? 'Publish' : 'Save Draft'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
