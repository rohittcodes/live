'use client';

import { useEffect, useRef } from 'react';
import { saveVideoProgress } from './progress-actions';

declare global {
  interface Window {
    Stream?: (iframe: HTMLIFrameElement) => {
      addEventListener: (event: string, handler: () => void) => void;
      removeEventListener: (event: string, handler: () => void) => void;
      currentTime: number;
      duration: number;
    };
  }
}

export function VideoPlayer({
  videoId,
  embedUrl,
  startTime,
  duration,
}: {
  videoId: string;
  embedUrl: string;
  startTime: number;
  duration: number | null;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let player: ReturnType<NonNullable<typeof window.Stream>> | null = null;

    function initPlayer() {
      if (!window.Stream || !iframeRef.current) return;
      player = window.Stream(iframeRef.current);

      function onTimeUpdate() {
        if (!player) return;
        const pos = Math.floor(player.currentTime);
        const dur = duration ?? player.duration;
        // Don't resume within last 30s of video (treat as completed)
        if (dur > 0 && pos >= dur - 30) return;

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
          saveVideoProgress(videoId, pos);
        }, 5000);
      }

      player.addEventListener('timeupdate', onTimeUpdate);
    }

    // Check if script is already loaded
    if (window.Stream) {
      initPlayer();
    } else {
      const script = document.createElement('script');
      script.src = 'https://embed.cloudflarestream.com/embed/r4xu.fla9.latest.js';
      script.defer = true;
      script.onload = initPlayer;
      document.head.appendChild(script);
    }

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [videoId, duration]);

  const src = startTime > 0 ? `${embedUrl}?startTime=${startTime}` : embedUrl;

  return (
    <iframe
      ref={iframeRef}
      src={src}
      className="h-full w-full"
      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
      allowFullScreen
    />
  );
}
