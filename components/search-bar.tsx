'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SearchIcon, RadioIcon, VideoIcon, UsersIcon, MessageSquareIcon, LoaderIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';

type SearchResults = {
  streams: { id: string; title: string; isLive: boolean; host: string }[];
  videos: { id: string; title: string; host: string }[];
  creators: { id: string; name: string; username: string | null }[];
  posts: { id: string; title: string; author: string }[];
};

export function SearchTrigger() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2.5 rounded-md border border-sidebar-border bg-sidebar-accent/40 px-3 py-2 text-sm text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground group-data-[collapsible=icon]:hidden"
      >
        <SearchIcon className="size-4 shrink-0" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="pointer-events-none hidden rounded border border-sidebar-border bg-sidebar px-1.5 py-0.5 font-mono text-xs sm:flex items-center gap-0.5">
          <span className="text-[10px]">⌃</span>K
        </kbd>
      </button>
      <SearchCommand open={open} onOpenChange={setOpen} />
    </>
  );
}

function SearchCommand({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!open) { setQuery(''); setResults(null); }
  }, [open]);

  useEffect(() => {
    if (query.length < 2) { setResults(null); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        setResults(await res.json() as SearchResults);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const navigate = useCallback((href: string) => {
    onOpenChange(false);
    router.push(href);
  }, [onOpenChange, router]);

  const hasResults = results && (
    results.streams.length + results.videos.length +
    results.creators.length + results.posts.length
  ) > 0;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command shouldFilter={false}>
      <CommandInput
        placeholder="Search streams, videos, creators, posts…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {loading && (
          <div className="flex items-center justify-center py-6">
            <LoaderIcon className="size-4 animate-spin text-muted-foreground" />
          </div>
        )}
        {!loading && query.length >= 2 && !hasResults && (
          <CommandEmpty>No results for &ldquo;{query}&rdquo;</CommandEmpty>
        )}
        {!loading && query.length < 2 && (
          <CommandEmpty>Start typing to search…</CommandEmpty>
        )}

        {results?.streams && results.streams.length > 0 && (
          <CommandGroup heading="Streams">
            {results.streams.map((s) => (
              <CommandItem key={s.id} onSelect={() => navigate(`/stream/${s.id}`)}>
                <RadioIcon className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{s.title}</span>
                <span className="text-xs text-muted-foreground">{s.host}</span>
                {s.isLive && <Badge variant="destructive" className="text-[9px] animate-pulse ml-1">LIVE</Badge>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results?.videos && results.videos.length > 0 && (
          <CommandGroup heading="Videos">
            {results.videos.map((v) => (
              <CommandItem key={v.id} onSelect={() => navigate(`/videos/${v.id}`)}>
                <VideoIcon className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{v.title}</span>
                <span className="text-xs text-muted-foreground">{v.host}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results?.creators && results.creators.length > 0 && (
          <CommandGroup heading="Creators">
            {results.creators.map((c) => (
              <CommandItem key={c.id} onSelect={() => navigate(`/creators/${c.username ?? c.id}`)}>
                <UsersIcon className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{c.name}</span>
                {c.username && <span className="text-xs text-muted-foreground">@{c.username}</span>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results?.posts && results.posts.length > 0 && (
          <CommandGroup heading="Posts">
            {results.posts.map((p) => (
              <CommandItem key={p.id} onSelect={() => navigate(`/community/${p.id}`)}>
                <MessageSquareIcon className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{p.title}</span>
                <span className="text-xs text-muted-foreground">{p.author}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {hasResults && (
          <CommandGroup>
            <CommandItem onSelect={() => navigate(`/search?q=${encodeURIComponent(query)}`)}>
              <SearchIcon className="size-3.5 shrink-0 text-muted-foreground" />
              <span>See all results for &ldquo;{query}&rdquo;</span>
            </CommandItem>
          </CommandGroup>
        )}
      </CommandList>
      </Command>
    </CommandDialog>
  );
}
