import type { Metadata } from 'next';
import Link from 'next/link';
import { desc, eq, count, sql } from 'drizzle-orm';

export const metadata: Metadata = {
  title: 'Creators',
  description: 'Browse all creators on Live.',
};
import db from '@/lib/db';
import { users, streams, videos } from '@/lib/db/schema';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { UsersIcon } from 'lucide-react';

export default async function CreatorsPage() {
  const creators = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      imageUrl: users.imageUrl,
      streamCount: sql<number>`cast(count(distinct ${streams.id}) as int)`,
      videoCount: sql<number>`cast(count(distinct ${videos.id}) as int)`,
    })
    .from(users)
    .leftJoin(streams, eq(streams.hostId, users.id))
    .leftJoin(videos, sql`${videos.hostId} = ${users.id} and ${videos.isPublished} = true`)
    .groupBy(users.id, users.name, users.username, users.imageUrl)
    .orderBy(desc(sql`count(distinct ${streams.id}) + count(distinct ${videos.id})`));

  const active = creators.filter((c) => c.streamCount > 0 || c.videoCount > 0);

  return (
    <div className="w-full p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Creators</h1>
        <span className="text-sm text-muted-foreground">{active.length} creator{active.length !== 1 ? 's' : ''}</span>
      </div>

      {active.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon"><UsersIcon /></EmptyMedia>
            <EmptyTitle>No creators yet</EmptyTitle>
            <EmptyDescription>Creators who publish streams or videos will appear here.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {active.map((creator) => {
            const initials = creator.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return (
              <Link key={creator.id} href={`/creators/${creator.username ?? creator.id}`}>
                <Card className="cursor-pointer transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10 shrink-0">
                        {creator.imageUrl && <AvatarImage src={creator.imageUrl} alt={creator.name} />}
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="line-clamp-1 text-sm">{creator.name}</CardTitle>
                        {creator.username && (
                          <CardDescription className="text-xs">@{creator.username}</CardDescription>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {creator.streamCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {creator.streamCount} stream{creator.streamCount !== 1 ? 's' : ''}
                        </Badge>
                      )}
                      {creator.videoCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {creator.videoCount} video{creator.videoCount !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
