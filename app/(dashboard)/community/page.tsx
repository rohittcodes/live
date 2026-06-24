import type { Metadata } from 'next';
import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';

export const metadata: Metadata = {
  title: 'Community',
  description: 'Read and discuss community posts.',
};
import db from '@/lib/db';
import { communityPosts } from '@/lib/db/schema';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { MessageSquareIcon } from 'lucide-react';

export default async function CommunityPage() {
  const posts = await db.query.communityPosts.findMany({
    where: eq(communityPosts.isPublished, true),
    with: { author: true },
    orderBy: desc(communityPosts.publishedAt),
  });

  return (
    <div className="w-full p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Community</h1>
      </div>

      {posts.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon"><MessageSquareIcon /></EmptyMedia>
            <EmptyTitle>No posts yet</EmptyTitle>
            <EmptyDescription>Community posts and announcements will appear here.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.id} href={`/community/${post.id}`}>
              <Card className="hover:ring-2 hover:ring-primary transition-all cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs capitalize">{post.type}</Badge>
                    {post.publishedAt && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.publishedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <CardTitle className="line-clamp-2 text-sm">{post.title}</CardTitle>
                  <CardDescription className="text-xs flex items-center gap-1">
                    {post.author.name}
                    <span>·</span>
                    <span>{post.likesCount} likes</span>
                    <span>·</span>
                    <span>{post.commentsCount} comments</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground line-clamp-4">{post.content}</p>
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {post.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
