'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

export function useStreamStatus(streamId: string, initialIsLive: boolean, initialTitle?: string) {
  const router = useRouter();
  const wasLive = useRef(initialIsLive);
  const prevTitle = useRef(initialTitle);

  const { data } = useQuery({
    queryKey: ['stream-status', streamId],
    queryFn: async () => {
      const r = await fetch(`/api/overlay/${streamId}/data`);
      return r.json() as Promise<{ isLive: boolean; viewerCount: number; title: string; category: string | null }>;
    },
    refetchInterval: 8000,
    staleTime: 0,
    enabled: true,
  });

  useEffect(() => {
    if (!data) return;
    const liveChanged = data.isLive !== wasLive.current;
    const titleChanged = prevTitle.current !== undefined && data.title !== prevTitle.current;
    if (liveChanged || titleChanged) {
      wasLive.current = data.isLive;
      prevTitle.current = data.title;
      router.refresh();
    }
  }, [data?.isLive, data?.title]);

  return { viewerCount: data?.viewerCount ?? 0, isLive: data?.isLive ?? initialIsLive };
}
