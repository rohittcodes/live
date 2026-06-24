import { desc, count } from 'drizzle-orm';
import { UsersIcon, VideoIcon, RadioIcon, MicIcon } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import db from '@/lib/db';
import { users, streams, videos, audioRooms } from '@/lib/db/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserActions } from './user-actions';
import { StreamsTab } from './streams-tab';
import { VideosTab } from './videos-tab';

export default async function AdminPage() {
  const currentAdmin = await requireAdmin();

  const [totalUsers, totalStreams, totalVideos, totalRooms, allUsers, allStreams, allVideos] = await Promise.all([
    db.select({ total: count() }).from(users),
    db.select({ total: count() }).from(streams),
    db.select({ total: count() }).from(videos),
    db.select({ total: count() }).from(audioRooms),
    db.select().from(users).orderBy(desc(users.createdAt)),
    db.query.streams.findMany({ with: { host: true }, orderBy: desc(streams.createdAt) }),
    db.query.videos.findMany({ with: { host: true }, orderBy: desc(videos.createdAt) }),
  ]);

  const stats = [
    { label: 'Total Users',   value: totalUsers[0].total,   icon: UsersIcon },
    { label: 'Total Streams', value: totalStreams[0].total,  icon: RadioIcon },
    { label: 'Total Videos',  value: totalVideos[0].total,   icon: VideoIcon },
    { label: 'Audio Rooms',   value: totalRooms[0].total,    icon: MicIcon   },
  ];

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="px-4 pt-4 pb-1">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-medium uppercase tracking-wide">{s.label}</CardDescription>
                <s.icon className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <span className="text-3xl font-bold tabular-nums">{s.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="streams">Streams</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
        </TabsList>

        {/* Users tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-sm font-semibold">Users</CardTitle>
              <CardDescription className="text-xs">Manage roles and platform access.</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              {allUsers.map((user, i) => {
                const initials = user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
                const isSelf = user.id === currentAdmin.id;

                return (
                  <div key={user.id}>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <Avatar>
                        <AvatarImage src={user.imageUrl ?? undefined} alt={user.name} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-medium">{user.name}</span>
                          {user.isBanned && <Badge variant="destructive" className="text-[10px]">banned</Badge>}
                        </div>
                        <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                      </div>
                      <span className="hidden text-xs text-muted-foreground sm:block shrink-0 w-24 text-right">
                        {new Date(user.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <div className="shrink-0">
                        <UserActions userId={user.id} role={user.role} isBanned={user.isBanned} isSelf={isSelf} />
                      </div>
                    </div>
                    {i < allUsers.length - 1 && <Separator />}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Streams tab */}
        <TabsContent value="streams">
          <Card>
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-sm font-semibold">All Streams</CardTitle>
              <CardDescription className="text-xs">View and delete any stream on the platform.</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              <StreamsTab streams={allStreams} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Videos tab */}
        <TabsContent value="videos">
          <Card>
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-sm font-semibold">All Videos</CardTitle>
              <CardDescription className="text-xs">Publish, unpublish, or delete any video.</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              <VideosTab videos={allVideos} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
