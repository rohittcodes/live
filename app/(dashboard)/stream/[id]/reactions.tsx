'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDataChannel } from '@livekit/components-react';
import { saveReaction } from './reaction-actions';

type ReactionType = 'heart' | 'fire' | 'clap' | 'wow' | 'laugh';

const EMOJIS: Record<ReactionType, string> = {
  heart: '❤️',
  fire: '🔥',
  clap: '👏',
  wow: '😮',
  laugh: '😂',
};

type FloatingReaction = {
  id: string;
  emoji: string;
  x: number;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function ReactionsOverlay({
  streamId,
  userId,
  reactRef,
}: {
  streamId: string;
  userId: string | null;
  reactRef?: React.MutableRefObject<((type: ReactionType) => void) | null>;
}) {
  const [floating, setFloating] = useState<FloatingReaction[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const spawnEmoji = useCallback((emoji: string) => {
    const id = crypto.randomUUID();
    const x = 10 + Math.random() * 80; // random horizontal position %
    setFloating((prev) => [...prev, { id, emoji, x }]);
    setTimeout(() => setFloating((prev) => prev.filter((f) => f.id !== id)), 3000);
  }, []);

  const { send } = useDataChannel('reactions', (msg) => {
    try {
      const data = JSON.parse(decoder.decode(msg.payload)) as { emoji: string };
      if (data.emoji) spawnEmoji(data.emoji);
    } catch {
      // ignore malformed messages
    }
  });

  function handleReact(type: ReactionType) {
    const emoji = EMOJIS[type];
    spawnEmoji(emoji);
    send(encoder.encode(JSON.stringify({ emoji })), { reliable: false });
    if (userId) saveReaction(streamId, type);
  }

  useEffect(() => {
    if (reactRef) reactRef.current = handleReact;
  });

  return (
    <>
      {/* Floating emojis */}
      <div
        ref={containerRef}
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        {floating.map((f) => (
          <span
            key={f.id}
            className="absolute bottom-12 animate-float-up text-2xl select-none"
            style={{ left: `${f.x}%` }}
          >
            {f.emoji}
          </span>
        ))}
      </div>

      {/* Reaction bar */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 rounded-full border bg-background/80 backdrop-blur-sm px-3 py-1.5 shadow-lg">
        {(Object.entries(EMOJIS) as [ReactionType, string][]).map(([type, emoji], i) => (
          <button
            key={type}
            onClick={() => handleReact(type)}
            className="text-xl leading-none p-1 rounded-full hover:bg-muted transition-colors active:scale-125 relative group"
            title={`${type} (${i + 1})`}
          >
            {emoji}
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity font-mono">{i + 1}</span>
          </button>
        ))}
      </div>
    </>
  );
}
