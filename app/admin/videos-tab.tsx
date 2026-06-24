'use client';

import { useTransition } from 'react';
import { Trash2Icon, VideoIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { deleteVideo, toggleVideoPublish } from './admin-actions';

type VideoRow = {
  id: string;
  title: string;
  isPublished: boolean;
  totalViews: number;
  createdAt: Date;
  host: { name: string };
};

export function VideosTab({ videos }: { videos: VideoRow[] }) {
  const [pending, startTransition] = useTransition();

  if (videos.length === 0) {
    return <p className="px-4 py-8 text-center text-sm text-muted-foreground">No videos yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Host</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Views</TableHead>
          <TableHead className="text-right">Created</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {videos.map((v) => (
          <TableRow key={v.id}>
            <TableCell className="font-medium max-w-[200px] truncate">
              <div className="flex items-center gap-2">
                <VideoIcon className="size-3.5 shrink-0 text-muted-foreground" />
                {v.title}
              </div>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">{v.host.name}</TableCell>
            <TableCell>
              {v.isPublished
                ? <Badge variant="default" className="text-[10px]">Published</Badge>
                : <Badge variant="secondary" className="text-[10px]">Draft</Badge>}
            </TableCell>
            <TableCell className="text-right text-sm">{v.totalViews.toLocaleString()}</TableCell>
            <TableCell className="text-right text-xs text-muted-foreground">
              {new Date(v.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  disabled={pending}
                  title={v.isPublished ? 'Unpublish' : 'Publish'}
                  onClick={() => startTransition(() => toggleVideoPublish(v.id, !v.isPublished))}
                >
                  {v.isPublished ? <EyeOffIcon className="size-3.5" /> : <EyeIcon className="size-3.5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-destructive hover:text-destructive"
                  disabled={pending}
                  onClick={() => {
                    if (!confirm(`Delete "${v.title}"? This cannot be undone.`)) return;
                    startTransition(() => deleteVideo(v.id));
                  }}
                >
                  <Trash2Icon className="size-3.5" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
