import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

function makeRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = makeRedis();

// 30 viewer token requests per minute per IP (unauthenticated endpoint)
export const viewerTokenLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, '1 m'), prefix: 'rl:viewer-token' })
  : null;

// 5 join requests per minute per user
export const joinRequestLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '1 m'), prefix: 'rl:join-request' })
  : null;

// 60 reactions per minute per user
export const reactionLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, '1 m'), prefix: 'rl:reaction' })
  : null;

// 20 clips per minute per user
export const clipLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, '1 m'), prefix: 'rl:clip' })
  : null;

// 30 search requests per minute per IP
export const searchLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, '1 m'), prefix: 'rl:search' })
  : null;

// 120 overlay data polls per minute per IP (polls every 5 s)
export const overlayLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(120, '1 m'), prefix: 'rl:overlay' })
  : null;

// Prefer platform-set headers over client-spoofable x-forwarded-for
export function getIp(headers: Headers): string {
  return (
    headers.get('cf-connecting-ip') ??
    headers.get('x-real-ip') ??
    headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    'unknown'
  );
}
