'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

export default function ViewersOverlay() {
  const { streamId } = useParams<{ streamId: string }>();

  const { data } = useQuery({
    queryKey: ['overlay-data', streamId],
    queryFn: async () => {
      const r = await fetch(`/api/overlay/${streamId}/data`);
      return r.json() as Promise<{ viewerCount: number; isLive: boolean }>;
    },
    refetchInterval: 5000,
    staleTime: 0,
  });

  if (!data) return null;

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: 'rgba(0,0,0,0.6)',
      color: '#fff',
      padding: '6px 14px',
      borderRadius: 20,
      fontFamily: 'system-ui, sans-serif',
      fontSize: 18,
      fontWeight: 600,
    }}>
      <span style={{ color: '#ef4444', fontSize: 10 }}>●</span>
      {data.viewerCount.toLocaleString()} watching
    </div>
  );
}
