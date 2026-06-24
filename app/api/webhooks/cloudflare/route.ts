import { eq } from 'drizzle-orm';
import { type NextRequest } from 'next/server';
import db from '@/lib/db';
import { videos } from '@/lib/db/schema';

// Cloudflare Stream sends a Webhook-Signature header for verification.
// Format: "time=<epoch>,sig1=<hmac-sha256-hex>"
// Set CLOUDFLARE_STREAM_WEBHOOK_SECRET in your env (from CF dashboard → Stream → Webhooks).
async function verifySignature(body: string, header: string | null): Promise<boolean> {
  const secret = process.env.CLOUDFLARE_STREAM_WEBHOOK_SECRET;
  if (!secret) return false; // reject if secret is not configured

  if (!header) return false;

  // Parse header carefully — values may contain '=' (e.g. base64), so only split on first '='
  const parts: Record<string, string> = {};
  for (const segment of header.split(',')) {
    const eq = segment.indexOf('=');
    if (eq === -1) continue;
    parts[segment.slice(0, eq).trim()] = segment.slice(eq + 1).trim();
  }
  const timestamp = parts['time'];
  const signature = parts['sig1'];
  if (!timestamp || !signature) return false;

  // Reject events older than 5 minutes (replay protection)
  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (isNaN(age) || age > 300) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  const sigBytes = Uint8Array.from(Buffer.from(signature, 'hex'));
  const message = new TextEncoder().encode(`${timestamp}.${body}`);

  return crypto.subtle.verify('HMAC', key, sigBytes, message);
}

type CFStreamEvent = {
  uid: string;
  readyToStream?: boolean;
  status?: { state: string; errorReasonCode?: string; errorReasonText?: string };
  duration?: number;
  input?: { width: number; height: number };
  meta?: { name?: string };
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('Webhook-Signature');

  if (!(await verifySignature(body, sig))) {
    return new Response('Invalid signature', { status: 401 });
  }

  try {
    const event = JSON.parse(body) as CFStreamEvent;
    const { uid, status, duration } = event;

    if (!uid) return new Response('OK', { status: 200 });

    if (status?.state === 'ready') {
      await db.update(videos).set({
        status: 'ready',
        isPublished: true,
        duration: duration ? Math.round(duration) : null,
        updatedAt: new Date(),
      }).where(eq(videos.cloudflareVideoId, uid));
    } else if (status?.state === 'error') {
      await db.update(videos).set({
        status: 'error',
        updatedAt: new Date(),
      }).where(eq(videos.cloudflareVideoId, uid));
    } else if (status?.state === 'inprogress') {
      await db.update(videos).set({
        status: 'inprogress',
        updatedAt: new Date(),
      }).where(eq(videos.cloudflareVideoId, uid));
    }

    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error('[cloudflare webhook]', err);
    return new Response('Bad request', { status: 400 });
  }
}
