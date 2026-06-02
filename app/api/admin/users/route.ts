import { eq } from 'drizzle-orm';
import { type NextRequest } from 'next/server';
import { assertAdmin, AuthError } from '@/lib/auth';
import db from '@/lib/db';
import { users } from '@/lib/db/schema';

/** PATCH /api/admin/users  — promote or demote a user's role */
export async function PATCH(req: NextRequest) {
  try {
    await assertAdmin();

    const body = await req.json();
    const { userId, role } = body as { userId?: string; role?: string };

    if (!userId || !role) {
      return Response.json({ error: 'userId and role are required' }, { status: 400 });
    }
    if (role !== 'user' && role !== 'admin') {
      return Response.json({ error: 'role must be "user" or "admin"' }, { status: 400 });
    }

    const target = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!target) return Response.json({ error: 'User not found' }, { status: 404 });

    await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return Response.json({ ok: true, userId, role });
  } catch (err) {
    if (err instanceof AuthError) return err.toResponse();
    console.error('[admin/users PATCH]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
