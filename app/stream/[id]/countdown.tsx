'use client';

import { useEffect, useState } from 'react';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function getRemaining(target: Date) {
  const diff = Math.max(0, target.getTime() - Date.now());
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);
  return { h, m, s, done: diff === 0 };
}

export function Countdown({ scheduledAt }: { scheduledAt: string }) {
  const target = new Date(scheduledAt);
  const [time, setTime] = useState(() => getRemaining(target));

  useEffect(() => {
    const id = setInterval(() => {
      const next = getRemaining(target);
      setTime(next);
      if (next.done) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [scheduledAt]);

  if (time.done) return <span className="text-muted-foreground text-sm">Starting soon…</span>;

  return (
    <div className="flex items-center gap-1 font-mono text-3xl font-bold tabular-nums">
      {time.h > 0 && <><span>{pad(time.h)}</span><span className="text-muted-foreground">:</span></>}
      <span>{pad(time.m)}</span>
      <span className="text-muted-foreground">:</span>
      <span>{pad(time.s)}</span>
    </div>
  );
}
