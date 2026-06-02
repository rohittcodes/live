export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const required: Record<string, string> = {
    CLERK_SECRET_KEY: 'Clerk authentication',
    DATABASE_URL: 'Neon database',
    LIVEKIT_API_KEY: 'LiveKit streaming',
    LIVEKIT_API_SECRET: 'LiveKit streaming',
    CLOUDFLARE_ACCOUNT_ID: 'Cloudflare (videos + thumbnails)',
    CLOUDFLARE_STREAM_API_TOKEN: 'Cloudflare Stream video upload/delete',
    CLOUDFLARE_STREAM_WEBHOOK_SECRET: 'Cloudflare Stream webhook — will reject all webhook calls',
    CLOUDFLARE_IMAGES_API_TOKEN: 'Cloudflare Images thumbnail upload',
    CLOUDFLARE_R2_ACCESS_KEY_ID: 'Cloudflare R2 recording storage',
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: 'Cloudflare R2 recording storage',
    CLOUDFLARE_R2_BUCKET: 'Cloudflare R2 recording storage',
    CLOUDFLARE_R2_ENDPOINT: 'Cloudflare R2 recording storage',
  };

  const optional: Record<string, string> = {
    UPSTASH_REDIS_REST_URL: 'Upstash Redis — rate limiting will not be enforced',
    UPSTASH_REDIS_REST_TOKEN: 'Upstash Redis — rate limiting will not be enforced',
  };

  const missing = Object.entries(required).filter(([k]) => !process.env[k]);
  const empty = Object.entries(required).filter(([k]) => process.env[k] === '');
  const missingOptional = Object.entries(optional).filter(([k]) => !process.env[k]);

  if (missing.length > 0) {
    for (const [key, desc] of missing) {
      console.error(`[env] MISSING ${key} — ${desc}`);
    }
  }
  if (empty.length > 0) {
    for (const [key, desc] of empty) {
      console.warn(`[env] EMPTY ${key} — ${desc}`);
    }
  }
  if (missingOptional.length > 0) {
    for (const [key, desc] of missingOptional) {
      console.warn(`[env] optional ${key} not set — ${desc}`);
    }
  }
}
