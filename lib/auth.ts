import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import db from '@/lib/db';
import { users } from '@/lib/db/schema';

export type AuthUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

// ─── Low-level ────────────────────────────────────────────────────────────────

/** Returns the DB user for the signed-in Clerk session, or null.
 *  Syncs username + imageUrl from Clerk when the DB record is stale. */
export async function getCurrentUser() {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const dbUser = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!dbUser) return null;

    // If username is missing, pull fresh data from Clerk (request-cached, no extra network hop)
    if (!dbUser.username) {
      const clerkUser = await currentUser();
      const freshUsername = clerkUser?.username || null;
      const freshImage = clerkUser?.imageUrl ?? dbUser.imageUrl;
      if (freshUsername || freshImage !== dbUser.imageUrl) {
        await db.update(users)
          .set({ username: freshUsername, imageUrl: freshImage, updatedAt: new Date() })
          .where(eq(users.id, userId));
        return { ...dbUser, username: freshUsername, imageUrl: freshImage };
      }
    }

    return dbUser;
  } catch (err) {
    console.error('[getCurrentUser]', err);
    return null;
  }
}

// ─── Page / Server Component guards (redirect on failure) ─────────────────────

/** Require a signed-in user. Redirects to /sign-in if not. */
export async function requireAuth(): Promise<AuthUser> {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) redirect('/sign-in');
  return user;
}

/** Require admin role. Redirects to / if signed in but not admin. */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.role !== 'admin') redirect('/');
  return user;
}

/** Require the caller owns the resource OR is admin. Redirects to / otherwise. */
export async function requireOwnerOrAdmin(resourceUserId: string): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.id !== resourceUserId && user.role !== 'admin') redirect('/');
  return user;
}

// ─── API Route / Server Action guards (throw on failure) ──────────────────────

export class AuthError extends Error {
  constructor(
    public readonly status: 401 | 403,
    message: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }

  toResponse() {
    return Response.json({ error: this.message }, { status: this.status });
  }
}

/** Assert signed-in in an API route or server action. Throws AuthError on failure. */
export async function assertAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError(401, 'Unauthorized');
  return user;
}

/** Assert admin role. Throws AuthError 403 if signed in but not admin. */
export async function assertAdmin(): Promise<AuthUser> {
  const user = await assertAuth();
  if (user.role !== 'admin') throw new AuthError(403, 'Forbidden');
  return user;
}

/** Assert the caller owns the resource OR is admin. Throws AuthError 403 otherwise. */
export async function assertOwnerOrAdmin(resourceUserId: string): Promise<AuthUser> {
  const user = await assertAuth();
  if (user.id !== resourceUserId && user.role !== 'admin') {
    throw new AuthError(403, 'Forbidden');
  }
  return user;
}

// ─── Convenience ──────────────────────────────────────────────────────────────

export function isAdmin(user: AuthUser) {
  return user.role === 'admin';
}
