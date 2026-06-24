import Link from 'next/link';
import { desc } from 'drizzle-orm';
import { UploadIcon, VideoIcon } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import db from '@/lib/db';
import { videos } from '@/lib/db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty';
import { PublishToggle } from './publish-toggle';
import { DeleteVideoButton } from './delete-button';

function formatDuration(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  return `${m}:${String(sec).padStart(2,'0')}`;
}

export default async function DashboardVideosPage() {
  await requireAdmin();

  const myVideos = await db.query.videos.findMany({ orderBy: desc(videos.createdAt) });

  return (
    <div className="w-full p-4 space-y-4">
      <div className="flex justify-end">
        <Button asChild size="sm">
          <Link href="/videos/upload">
            <UploadIcon className="mr-1.5 size-4" />
            Upload Video
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-sm font-semibold">All Videos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {myVideos.length === 0 ? (
            <Empty className="m-4 border">
              <EmptyHeader>
                <EmptyMedia variant="icon"><VideoIcon /></EmptyMedia>
                <EmptyTitle>No videos yet</EmptyTitle>
                <EmptyDescription>Upload your first video.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button size="sm" asChild><Link href="/videos/upload">Upload Video</Link></Button>
              </EmptyContent>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead className="text-right">Published</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myVideos.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      <Link href={`/videos/${v.id}`} className="hover:text-primary">{v.title}</Link>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">
                      {v.duration ? formatDuration(v.duration) : '—'}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">{v.totalViews.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      {v.status === 'ready'
                        ? <Badge variant="outline" className="text-[10px]">Ready</Badge>
                        : v.status === 'error'
                        ? <Badge variant="destructive" className="text-[10px]">Error</Badge>
                        : <Badge variant="secondary" className="text-[10px]">Processing</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <PublishToggle id={v.id} published={v.isPublished} disabled={v.status !== 'ready'} />
                    </TableCell>
                    <TableCell className="text-right">
                      <DeleteVideoButton id={v.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
