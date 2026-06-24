'use client';

import { useEffect, useRef, useState } from 'react';
import {
  LiveKitRoom,
  useChat,
} from '@livekit/components-react';

type ChatMessage = { id: string; from?: { name?: string } | null; message: string };

function ChatFeed() {
  const { chatMessages } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const recent = (chatMessages as ChatMessage[]).slice(-6);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      padding: '8px 12px',
      width: 380,
      fontFamily: 'system-ui, sans-serif',
    }}>
      {recent.map((msg) => (
        <div key={msg.id} style={{
          background: 'rgba(0,0,0,0.65)',
          color: '#fff',
          borderRadius: 8,
          padding: '5px 10px',
          fontSize: 14,
          lineHeight: 1.4,
        }}>
          <span style={{ fontWeight: 700, marginRight: 6, color: '#a78bfa' }}>
            {msg.from?.name ?? 'Anon'}
          </span>
          {msg.message}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

export default function ChatOverlay({
  searchParams,
}: {
  searchParams: Promise<{ room?: string; token?: string }>;
}) {
  const [params, setParams] = useState<{ room?: string; token?: string }>({});

  useEffect(() => {
    searchParams.then(setParams);
  }, []);

  const { room, token } = params;

  if (!room || !token) {
    return (
      <div style={{ color: '#fff', fontFamily: 'sans-serif', padding: 12, fontSize: 12, opacity: 0.5 }}>
        Provide ?room=&token= query params
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL!}
      connect={true}
      audio={false}
      video={false}
    >
      <ChatFeed />
    </LiveKitRoom>
  );
}
