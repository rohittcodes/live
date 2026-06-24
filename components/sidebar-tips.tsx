'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRightIcon, MicIcon, MessageSquareIcon, UsersIcon, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tip = {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
};

const TIPS: Tip[] = [
  {
    icon: MicIcon,
    title: 'Audio rooms',
    description: 'Join live voice conversations with the community.',
    href: '/rooms',
  },
  {
    icon: MessageSquareIcon,
    title: 'Community posts',
    description: 'Catch announcements and updates from creators.',
    href: '/community',
  },
  {
    icon: UsersIcon,
    title: 'Discover creators',
    description: 'Follow streamers and get notified when they go live.',
    href: '/creators',
  },
];

const ROTATE_MS = 5000;

export function SidebarTips() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % TIPS.length), ROTATE_MS);
    return () => clearInterval(id);
  }, []);

  const tip = TIPS[index];

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Tips"
      className="group/tips relative h-[108px] overflow-hidden rounded-xl bg-gradient-to-br from-[#3140f5] to-[#1698e0] shadow-[0_8px_24px_-12px_rgba(49,64,245,0.55)] group-data-[collapsible=icon]:hidden"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(at_25%_15%,rgba(255,255,255,0.16),transparent_60%)]"
      />
      <div className="relative flex h-full flex-col gap-2 p-3.5">
        <ArrowUpRightIcon
          aria-hidden
          className="pointer-events-none absolute top-3 right-3 size-3.5 text-white/80"
        />
        <Link
          href={tip.href}
          className="flex flex-1 flex-col gap-1.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <div className="flex items-center gap-1.5">
            <tip.icon className="size-4 shrink-0 text-white" />
            <p className="text-[15px] leading-tight font-semibold text-balance text-white">{tip.title}</p>
          </div>
          <p className="text-[13px] leading-snug text-pretty text-white/85">{tip.description}</p>
        </Link>
        <div className="mt-1 flex items-center gap-1" role="tablist">
          {TIPS.map((t, i) => (
            <button
              key={t.title}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show ${t.title}`}
              onClick={() => setIndex(i)}
              className={cn(
                'h-1 rounded-full transition-all',
                i === index ? 'w-5 bg-white' : 'w-1 bg-white/40 hover:bg-white/60'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
