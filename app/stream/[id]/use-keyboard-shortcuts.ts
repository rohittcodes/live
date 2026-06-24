'use client';

import { useEffect, type RefObject } from 'react';

type ReactionType = 'heart' | 'fire' | 'clap' | 'wow' | 'laugh';

const REACTION_KEYS: Record<string, ReactionType> = {
  '1': 'heart',
  '2': 'fire',
  '3': 'clap',
  '4': 'wow',
  '5': 'laugh',
};

export function useKeyboardShortcuts({
  onReaction,
  onMuteToggle,
  containerRef,
  enabled = true,
}: {
  onReaction: (type: ReactionType) => void;
  onMuteToggle: () => void;
  containerRef: RefObject<HTMLElement | null>;
  enabled?: boolean;
}) {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (REACTION_KEYS[e.key]) {
        onReaction(REACTION_KEYS[e.key]);
        return;
      }
      if (e.key === 'm' || e.key === 'M') {
        onMuteToggle();
        return;
      }
      if (e.key === 'f' || e.key === 'F') {
        const el = containerRef.current;
        if (el) {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            el.requestFullscreen().catch(() => {});
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onReaction, onMuteToggle]);
}
