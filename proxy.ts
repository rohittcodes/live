import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/videos',
  '/videos/(.*)',
  '/rooms',
  '/rooms/(.*)',
  '/stream/(.*)',       // anyone can watch streams
  '/community(.*)',
  '/creators(.*)',
  '/api/livekit/token', // handles its own auth per token type
  '/api/webhooks(.*)', // Clerk webhook must be unauthenticated
]);

const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isSettingsRoute = createRouteMatcher(['/settings(.*)']);

function buildCsp(nonce: string): string {
  const livekitHost = (process.env.NEXT_PUBLIC_LIVEKIT_URL ?? '').replace(/^wss?:\/\//, '');
  const cfSubdomain = process.env.CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN ?? '';
  const r2PublicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL ?? '';
  const r2Host = r2PublicUrl ? new URL(r2PublicUrl).host : '';

  // Clerk production instances behind a custom domain proxy their JS/API at clerk.<app-host>
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const clerkCustomDomain = appUrl ? `clerk.${new URL(appUrl).host}` : '';

  return [
    "default-src 'self'",
    // nonce replaces unsafe-inline; unsafe-eval retained for LiveKit WASM codec
    [
      `script-src 'self' 'nonce-${nonce}' 'unsafe-eval' https://*.clerk.accounts.dev`,
      clerkCustomDomain && `https://${clerkCustomDomain}`,
    ].filter(Boolean).join(' '),
    "style-src 'self' 'unsafe-inline'",
    [
      "img-src 'self' data: blob: https://imagedelivery.net https://img.clerk.com",
      cfSubdomain && `https://${cfSubdomain}`,
    ].filter(Boolean).join(' '),
    [
      "media-src 'self' blob:",
      cfSubdomain && `https://${cfSubdomain}`,
      r2Host && `https://${r2Host}`,
    ].filter(Boolean).join(' '),
    [
      "connect-src 'self' https://api.cloudflare.com https://clerk.com https://*.clerk.accounts.dev",
      clerkCustomDomain && `https://${clerkCustomDomain}`,
      livekitHost && `wss://${livekitHost} https://${livekitHost}`,
    ].filter(Boolean).join(' '),
    "worker-src 'self' blob:",
    "font-src 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
}

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req) || isSettingsRoute(req) || !isPublicRoute(req)) {
    await auth.protect();
  }

  const nonce = btoa(crypto.randomUUID());
  const reqHeaders = new Headers(req.headers);
  reqHeaders.set('x-nonce', nonce);

  return NextResponse.next({
    request: { headers: reqHeaders },
    headers: { 'Content-Security-Policy': buildCsp(nonce) },
  });
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|css)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
};
