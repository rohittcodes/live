import type { Metadata } from 'next';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import db from '@/lib/db';
import { communityPosts } from '@/lib/db/schema';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const post = await db.query.communityPosts.findFirst({
    where: eq(communityPosts.id, id),
    with: { author: true },
  });
  if (!post || !post.isPublished) return {};
  return {
    title: post.title,
    description: `By ${post.author.name}`,
    openGraph: {
      title: post.title,
      description: `Community post by ${post.author.name}`,
      images: post.author.imageUrl ? [post.author.imageUrl] : [],
    },
  };
}
import { Badge } from '@/components/ui/badge';
import { BreadcrumbLabel } from '@/components/breadcrumb-labels';

export default async function CommunityPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const post = await db.query.communityPosts.findFirst({
    where: eq(communityPosts.id, id),
    with: { author: true },
  });

  if (!post || !post.isPublished) notFound();

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-4">
      <BreadcrumbLabel id={id} name={post.title} />
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="capitalize">{post.type}</Badge>
        {post.publishedAt && (
          <span className="text-xs text-muted-foreground">
            {new Date(post.publishedAt).toLocaleDateString()}
          </span>
        )}
      </div>
      <h1 className="text-2xl font-bold">{post.title}</h1>
      <p className="text-sm text-muted-foreground">By {post.author.name}</p>
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>
      </div>
      {post.imageUrls && post.imageUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-2 pt-2">
          {post.imageUrls.map((url) => (
            <div key={url} className="relative aspect-video rounded-lg overflow-hidden border">
              <Image src={url} alt="" fill className="object-cover" sizes="(max-width: 672px) 50vw, 336px" />
            </div>
          ))}
        </div>
      )}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-2">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
          ))}
        </div>
      )}
    </div>
  );
}
