import { desc } from 'drizzle-orm';
import { MessageSquareIcon } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import db from '@/lib/db';
import { communityPosts } from '@/lib/db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty';
import { CreatePostDialog } from './create-post-dialog';
import { PublishPostToggle } from './publish-toggle';
import { DeletePostButton } from './delete-button';

const typeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  announcement: 'default',
  update: 'secondary',
  post: 'outline',
};

export default async function DashboardCommunityPage() {
  await requireAdmin();

  const posts = await db.query.communityPosts.findMany({
    orderBy: desc(communityPosts.createdAt),
  });

  return (
    <div className="w-full p-4 space-y-4">
      <div className="flex justify-end">
        <CreatePostDialog />
      </div>

      <Card>
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-sm font-semibold">All Posts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {posts.length === 0 ? (
            <Empty className="m-4 border">
              <EmptyHeader>
                <EmptyMedia variant="icon"><MessageSquareIcon /></EmptyMedia>
                <EmptyTitle>No posts yet</EmptyTitle>
                <EmptyDescription>Create your first community post.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <CreatePostDialog />
              </EmptyContent>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Likes</TableHead>
                  <TableHead className="text-right">Comments</TableHead>
                  <TableHead className="text-right">Published</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium max-w-[240px] truncate">{post.title}</TableCell>
                    <TableCell>
                      <Badge variant={typeVariant[post.type] ?? 'outline'} className="text-[10px] capitalize">
                        {post.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">{post.likesCount}</TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">{post.commentsCount}</TableCell>
                    <TableCell className="text-right">
                      <PublishPostToggle id={post.id} published={post.isPublished} />
                    </TableCell>
                    <TableCell className="text-right">
                      <DeletePostButton id={post.id} />
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
