import type { Metadata } from 'next';
import { eq, and, or, ilike } from 'drizzle-orm';
import Link from 'next/link';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q?.trim() ?? '';
  return query
    ? { title: `"${query}"`, description: `Search results for "${query}" on Live` }
    : { title: 'Search', description: 'Search streams, videos, creators, and posts' };
}
import { RadioIcon, VideoIcon, MessageSquareIcon, SearchIcon } from 'lucide-react';
import db from '@/lib/db';
import { streams, videos, users, communityPosts } from '@/lib/db/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? '';

  if (!query || query.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-16 text-center">
        <SearchIcon className="size-10 text-muted-foreground/30" />
        <div>
          <p className="text-base font-medium">Search for anything</p>
          <p className="text-sm text-muted-foreground">Streams, videos, creators, posts — type at least 2 characters.</p>
        </div>
      </div>
    );
  }

  const subdomain = process.env.CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN;
  const term = `%${query.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;

  const [streamResults, videoResults, creatorResults, postResults] = await Promise.all([
    db.query.streams.findMany({
      where: or(ilike(streams.title, term), ilike(streams.category, term)),
      with: { host: true },
      limit: 10,
    }),
    db.query.videos.findMany({
      where: and(
        eq(videos.isPublished, true),
        or(ilike(videos.title, term), ilike(videos.description, term)),
      ),
      with: { host: true },
      limit: 10,
    }),
    db.query.users.findMany({
      where: or(ilike(users.name, term), ilike(users.username, term)),
      limit: 12,
    }),
    db.query.communityPosts.findMany({
      where: and(
        eq(communityPosts.isPublished, true),
        or(ilike(communityPosts.title, term), ilike(communityPosts.content, term)),
      ),
      with: { author: true },
      limit: 10,
    }),
  ]);

  const total =
    streamResults.length + videoResults.length + creatorResults.length + postResults.length;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <h1 className="text-lg font-semibold">Results for &ldquo;{query}&rdquo;</h1>
        <p className="text-sm text-muted-foreground">
          {total === 0 ? 'No results found' : `${total} result${total !== 1 ? 's' : ''}`}
        </p>
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <SearchIcon className="size-10 text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground">
            Nothing matched &ldquo;{query}&rdquo;. Try different keywords.
          </p>
        </div>
      ) : (
        <div className="px-6 py-8 space-y-10">

          {/* ── Creators ── */}
          {creatorResults.length > 0 && (
            <section>
              <div className="flex gap-6 overflow-x-auto pb-1 scrollbar-none">
                {creatorResults.map((c) => (
                  <Link
                    key={c.id}
                    href={`/creators/${c.username ?? c.id}`}
                    className="flex flex-col items-center gap-2.5 shrink-0 w-[110px]"
                  >
                    <div className="rounded-full ring-2 ring-border p-0.5">
                      <Avatar className="size-[90px]">
                        {c.imageUrl && <AvatarImage src={c.imageUrl} alt={c.name} />}
                        <AvatarFallback className="text-2xl font-semibold">{initials(c.name)}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="text-center w-full space-y-0.5">
                      <p className="text-sm font-medium line-clamp-1">{c.name}</p>
                      {c.username && (
                        <p className="text-xs text-muted-foreground truncate">@{c.username}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── Streams ── */}
          {streamResults.length > 0 && (
            <section>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {streamResults.map((s) => (
                  <Link
                    key={s.id}
                    href={`/stream/${s.id}`}
                    className="rounded-xl border border-border bg-card overflow-hidden"
                  >
                    <div className="aspect-video relative bg-muted flex items-center justify-center">
                      <RadioIcon className="size-7 text-muted-foreground/25" />
                      {s.isLive && (
                        <span className="absolute top-2 left-2 rounded px-1.5 py-0.5 bg-red-600 text-[10px] font-bold text-white uppercase tracking-wide">
                          Live
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2.5 p-3">
                      <Avatar className="size-7 shrink-0 mt-0.5">
                        {s.host.imageUrl && <AvatarImage src={s.host.imageUrl} alt={s.host.name} />}
                        <AvatarFallback className="text-[10px]">{initials(s.host.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium line-clamp-2 leading-snug">{s.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{s.host.name}</p>
                        {s.category && (
                          <p className="text-xs text-muted-foreground truncate">{s.category}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── Videos ── */}
          {videoResults.length > 0 && (
            <section>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {videoResults.map((v) => {
                  const thumb =
                    v.thumbnailUrl ??
                    (subdomain && v.cloudflareVideoId
                      ? `https://customer-${subdomain}.cloudflarestream.com/${v.cloudflareVideoId}/thumbnails/thumbnail.jpg`
                      : null);
                  return (
                    <Link
                      key={v.id}
                      href={`/videos/${v.id}`}
                      className="rounded-xl border border-border bg-card overflow-hidden"
                    >
                      <div className="aspect-video relative bg-muted">
                        {thumb ? (
                          <img src={thumb} alt={v.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <VideoIcon className="size-7 text-muted-foreground/25" />
                          </div>
                        )}
                        {v.duration && (
                          <span className="absolute bottom-1.5 right-1.5 rounded px-1.5 py-0.5 bg-black/70 text-[10px] font-medium text-white">
                            {formatDuration(v.duration)}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2.5 p-3">
                        <Avatar className="size-7 shrink-0 mt-0.5">
                          {v.host.imageUrl && <AvatarImage src={v.host.imageUrl} alt={v.host.name} />}
                          <AvatarFallback className="text-[10px]">{initials(v.host.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium line-clamp-2 leading-snug">{v.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{v.host.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {v.totalViews.toLocaleString()} views
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Posts ── */}
          {postResults.length > 0 && (
            <section>
              <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                {postResults.map((p) => (
                  <Link
                    key={p.id}
                    href={`/community/${p.id}`}
                    className="flex items-center gap-3 px-4 py-3 bg-card"
                  >
                    <Avatar className="size-7 shrink-0">
                      {p.author.imageUrl && <AvatarImage src={p.author.imageUrl} alt={p.author.name} />}
                      <AvatarFallback className="text-[10px]">{initials(p.author.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium line-clamp-1">{p.title}</p>
                      <p className="text-xs text-muted-foreground truncate">by {p.author.name}</p>
                    </div>
                    <MessageSquareIcon className="size-3.5 shrink-0 text-muted-foreground/30" />
                  </Link>
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  );
}
