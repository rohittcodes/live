import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import { PlusCircleIcon, RadioIcon, ArrowUpRightIcon } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import db from '@/lib/db';
import { streams } from '@/lib/db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty';
import { DeleteStreamButton } from './delete-button';

export default async function DashboardStreamsPage() {
  await requireAdmin();

  const myStreams = await db.query.streams.findMany({
    orderBy: desc(streams.createdAt),
  });

  return (
    <div className="w-full p-4 space-y-4">
      <div className="flex justify-end">
        <Button asChild size="sm">
          <Link href="/stream/new">
            <PlusCircleIcon className="mr-1.5 size-4" />
            New Stream
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-sm font-semibold">All Streams</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {myStreams.length === 0 ? (
            <Empty className="m-4 border">
              <EmptyHeader>
                <EmptyMedia variant="icon"><RadioIcon /></EmptyMedia>
                <EmptyTitle>No streams yet</EmptyTitle>
                <EmptyDescription>Create your first stream to get RTMP credentials.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button size="sm" asChild><Link href="/stream/new">Create Stream</Link></Button>
              </EmptyContent>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Peak</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myStreams.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/streams/${s.id}`} className="hover:text-primary flex items-center gap-1.5">
                        {s.title}
                        <ArrowUpRightIcon className="size-3 text-muted-foreground" />
                      </Link>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{s.totalViews.toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{s.peakConcurrentViewers}</TableCell>
                    <TableCell className="text-right">
                      {s.isLive
                        ? <Badge variant="destructive" className="animate-pulse text-[10px]">LIVE</Badge>
                        : <Badge variant="secondary" className="text-[10px]">Offline</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <DeleteStreamButton id={s.id} />
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
