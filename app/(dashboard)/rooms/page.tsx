import type { Metadata } from 'next';
import Link from 'next/link';
import { desc, inArray } from 'drizzle-orm';

export const metadata: Metadata = {
  title: 'Rooms',
  description: 'Join live audio rooms.',
};
import db from '@/lib/db';
import { audioRooms } from '@/lib/db/schema';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { MicIcon } from 'lucide-react';

export default async function RoomsPage() {
  const allRooms = await db.query.audioRooms.findMany({
    where: inArray(audioRooms.status, ['scheduled', 'active']),
    with: { host: true },
    orderBy: desc(audioRooms.createdAt),
  });

  const live = allRooms.filter((r) => r.status === 'active');
  const upcoming = allRooms.filter((r) => r.status === 'scheduled');

  return (
    <div className="w-full p-4 space-y-8">
      {allRooms.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon"><MicIcon /></EmptyMedia>
            <EmptyTitle>No rooms yet</EmptyTitle>
            <EmptyDescription>Active and scheduled audio rooms will appear here.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          {live.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
                Happening Now
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {live.map((room) => (
                  <Link key={room.id} href={`/rooms/${room.id}`}>
                    <Card className="cursor-pointer transition-all duration-300">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="line-clamp-1 text-sm">{room.title}</CardTitle>
                          <Badge variant="destructive" className="shrink-0 animate-pulse text-[10px]">LIVE</Badge>
                        </div>
                        <CardDescription className="text-xs">{room.host.name}</CardDescription>
                      </CardHeader>
                      {room.description && (
                        <CardContent>
                          <p className="text-xs text-muted-foreground line-clamp-2">{room.description}</p>
                        </CardContent>
                      )}
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {upcoming.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-sm font-semibold">Upcoming</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {upcoming.map((room) => (
                  <Link key={room.id} href={`/rooms/${room.id}`}>
                    <Card className="cursor-pointer transition-all duration-300">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="line-clamp-1 text-sm">{room.title}</CardTitle>
                          <Badge variant="secondary" className="shrink-0 text-[10px]">Audio</Badge>
                        </div>
                        <CardDescription className="text-xs">
                          {room.host.name}
                          {room.scheduledAt && (
                            <> · {new Date(room.scheduledAt).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</>
                          )}
                        </CardDescription>
                      </CardHeader>
                      {room.description && (
                        <CardContent>
                          <p className="text-xs text-muted-foreground line-clamp-2">{room.description}</p>
                        </CardContent>
                      )}
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
