import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { eq, and, count } from 'drizzle-orm';
import { BarChart3Icon, EyeIcon, UsersIcon, BookmarkIcon, ArrowLeftIcon } from 'lucide-react';
import db from '@/lib/db';
import { streams, reactions, streamPolls, streamClips } from '@/lib/db/schema';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BreadcrumbLabel } from '@/components/breadcrumb-labels';

const REACTION_EMOJIS: Record<string, string> = {
  heart: '❤️',
  fire: '🔥',
  clap: '👏',
  wow: '😮',
  laugh: '😂',
};

export default async function StreamRecapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const stream = await db.query.streams.findFirst({
    where: eq(streams.id, id),
    with: { host: true },
  });

  if (!stream) notFound();
  if (stream.isLive) redirect(`/stream/${id}`);
  if (stream.totalViews === 0) redirect(`/stream/${id}`);

  const [reactionRows, polls, clipCountResult] = await Promise.all([
    db
      .select({ type: reactions.type, count: count() })
      .from(reactions)
      .where(eq(reactions.streamId, id))
      .groupBy(reactions.type),
    db.query.streamPolls.findMany({
      where: and(eq(streamPolls.streamId, id)),
      with: { votes: true },
      orderBy: (t, { asc }) => asc(t.createdAt),
    }),
    db
      .select({ count: count() })
      .from(streamClips)
      .where(eq(streamClips.streamId, id)),
  ]);

  const clipCount = clipCountResult[0]?.count ?? 0;
  const totalReactions = reactionRows.reduce((s, r) => s + Number(r.count), 0);

  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-6">
      <BreadcrumbLabel id={id} name={stream.title} />
      {/* Back link */}
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href={`/stream/${id}`}>
          <ArrowLeftIcon className="size-3.5 mr-1.5" />
          Back to stream
        </Link>
      </Button>

      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{stream.title}</h1>
        <p className="text-sm text-muted-foreground">by {stream.host.name} · Stream recap</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={<EyeIcon className="size-4" />} label="Total views" value={stream.totalViews.toLocaleString()} />
        <StatCard icon={<UsersIcon className="size-4" />} label="Peak viewers" value={stream.peakConcurrentViewers.toLocaleString()} />
        <StatCard icon={<BookmarkIcon className="size-4" />} label="Clips created" value={clipCount.toLocaleString()} />
      </div>

      {/* Reactions */}
      {totalReactions > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-1.5">
            Reactions
            <Badge variant="secondary" className="text-[10px]">{totalReactions.toLocaleString()} total</Badge>
          </h2>
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => {
              const row = reactionRows.find((r) => r.type === type);
              const cnt = Number(row?.count ?? 0);
              return (
                <div key={type} className="rounded-xl border p-3 text-center space-y-1">
                  <span className="text-2xl">{emoji}</span>
                  <p className="text-sm font-semibold">{cnt.toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Polls */}
      {polls.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-1.5">
            <BarChart3Icon className="size-4" />
            Poll results
          </h2>
          <div className="space-y-4">
            {polls.map((poll) => {
              const total = poll.votes.length;
              return (
                <div key={poll.id} className="rounded-xl border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{poll.question}</p>
                    <Badge variant="secondary" className="text-[10px] shrink-0">{total} votes</Badge>
                  </div>
                  <div className="space-y-2">
                    {(poll.options as string[]).map((opt, i) => {
                      const cnt = poll.votes.filter((v) => v.optionIndex === i).length;
                      const pct = total > 0 ? Math.round((cnt / total) * 100) : 0;
                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>{opt}</span>
                            <span className="text-muted-foreground">{pct}%</span>
                          </div>
                          <Progress value={pct} className="h-1.5" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border p-4 space-y-1.5">
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">{icon}{label}</div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
