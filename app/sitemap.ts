import type { MetadataRoute } from 'next';
import { eq } from 'drizzle-orm';
import db from '@/lib/db';
import { videos, users, communityPosts } from '@/lib/db/schema';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const [allVideos, allCreators, allPosts] = await Promise.all([
    db.query.videos.findMany({ where: eq(videos.isPublished, true), columns: { id: true, updatedAt: true } }),
    db.query.users.findMany({ columns: { id: true, username: true, updatedAt: true } }),
    db.query.communityPosts.findMany({ where: eq(communityPosts.isPublished, true), columns: { id: true, updatedAt: true } }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/videos`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/creators`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/community`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${base}/rooms`, changeFrequency: 'hourly', priority: 0.6 },
  ];

  const videoRoutes: MetadataRoute.Sitemap = allVideos.map((v) => ({
    url: `${base}/videos/${v.id}`,
    lastModified: v.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const creatorRoutes: MetadataRoute.Sitemap = allCreators.map((c) => ({
    url: `${base}/creators/${c.username ?? c.id}`,
    lastModified: c.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  const postRoutes: MetadataRoute.Sitemap = allPosts.map((p) => ({
    url: `${base}/community/${p.id}`,
    lastModified: p.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.4,
  }));

  return [...staticRoutes, ...videoRoutes, ...creatorRoutes, ...postRoutes];
}
