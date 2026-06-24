'use client';

import { useTransition } from 'react';
import { Trash2Icon, RadioIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { deleteStream } from './admin-actions';

type StreamRow = {
  id: string;
  title: string;
  isLive: boolean;
  totalViews: number;
  createdAt: Date;
  host: { name: string };
};

export function StreamsTab({ streams }: { streams: StreamRow[] }) {
  const [pending, startTransition] = useTransition();

  if (streams.length === 0) {
    return <p className="px-4 py-8 text-center text-sm text-muted-foreground">No streams yet.</p>;
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
        {streams.map((s) => (
          <TableRow key={s.id}>
            <TableCell className="font-medium max-w-[200px] truncate">
              <div className="flex items-center gap-2">
                <RadioIcon className="size-3.5 shrink-0 text-muted-foreground" />
                {s.title}
              </div>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">{s.host.name}</TableCell>
            <TableCell>
              {s.isLive
                ? <Badge variant="destructive" className="text-[10px] animate-pulse">LIVE</Badge>
                : <Badge variant="secondary" className="text-[10px]">Offline</Badge>}
            </TableCell>
            <TableCell className="text-right text-sm">{s.totalViews.toLocaleString()}</TableCell>
            <TableCell className="text-right text-xs text-muted-foreground">
              {new Date(s.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-destructive hover:text-destructive"
                disabled={pending}
                onClick={() => {
                  if (!confirm(`Delete "${s.title}"? This cannot be undone.`)) return;
                  startTransition(() => deleteStream(s.id));
                }}
              >
                <Trash2Icon className="size-3.5" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
