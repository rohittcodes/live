'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { useDataChannel } from '@livekit/components-react';
import { BarChart3Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { votePoll } from './poll-actions';

type PollData = {
  id: string;
  question: string;
  options: string[];
  votes: { optionIndex: number }[];
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function PollPanel({
  userId,
  isHost,
}: {
  userId: string | null;
  isHost: boolean;
}) {
  const [poll, setPoll] = useState<PollData | null>(null);
  const [voted, setVoted] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const handleMessage = useCallback((msg: { payload: Uint8Array }) => {
    try {
      const data = JSON.parse(decoder.decode(msg.payload));
      if (data.type === 'poll:launch') setPoll(data.poll);
      if (data.type === 'poll:close') setPoll(null);
      if (data.type === 'poll:vote') {
        setPoll((prev) => {
          if (!prev || prev.id !== data.pollId) return prev;
          return { ...prev, votes: [...prev.votes, { optionIndex: data.optionIndex }] };
        });
      }
    } catch {
      // ignore
    }
  }, []);

  useDataChannel('polls', handleMessage);

  // Host broadcasts new poll via data channel — handled by CreatePollDialog in dashboard
  // Here we only receive and display

  if (!poll) return null;

  const totalVotes = poll.votes.length;

  function vote(optionIndex: number) {
    if (!poll || voted !== null) return;
    setVoted(optionIndex);
    startTransition(async () => {
      await votePoll(poll.id, optionIndex);
    });
  }

  return (
    <div className="shrink-0 border-b p-3 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium">
        <BarChart3Icon className="size-3.5" />
        Poll
      </div>
      <p className="text-sm font-medium">{poll.question}</p>
      <div className="space-y-2">
        {poll.options.map((opt, i) => {
          const count = poll.votes.filter((v) => v.optionIndex === i).length;
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const isChosen = voted === i;
          return (
            <div key={i} className="space-y-1">
              <button
                className={`w-full text-left text-xs px-2 py-1.5 rounded border transition-colors ${
                  voted !== null
                    ? isChosen
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted border-transparent'
                    : 'hover:bg-muted border-transparent'
                }`}
                disabled={voted !== null || pending}
                onClick={() => vote(i)}
              >
                {opt}
              </button>
              {voted !== null && (
                <div className="flex items-center gap-2">
                  <Progress value={pct} className="h-1 flex-1" />
                  <span className="text-[10px] text-muted-foreground w-7 text-right">{pct}%</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {voted !== null && (
        <p className="text-[10px] text-muted-foreground">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</p>
      )}
    </div>
  );
}
