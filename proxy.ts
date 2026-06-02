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

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req)) {
    await auth.protect();
    return NextResponse.next();
  }

  // Settings uses a catch-all route for Clerk's UserProfile — protect the root only
  if (isSettingsRoute(req)) {
    await auth.protect();
    return NextResponse.next();
  }

  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|css)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
};
