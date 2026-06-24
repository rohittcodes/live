import { eq } from 'drizzle-orm';
import { type NextRequest } from 'next/server';
import { assertAdmin, AuthError } from '@/lib/auth';
import db from '@/lib/db';
import { users } from '@/lib/db/schema';

/** PATCH /api/admin/users  — promote/demote role or ban/unban */
export async function PATCH(req: NextRequest) {
  try {
    const admin = await assertAdmin();

    const body = await req.json() as { userId?: string; role?: string; isBanned?: boolean };
    const { userId } = body;

    if (!userId) return Response.json({ error: 'userId is required' }, { status: 400 });
    if (userId === admin.id) return Response.json({ error: 'Cannot modify your own account' }, { status: 400 });

    const target = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!target) return Response.json({ error: 'User not found' }, { status: 404 });

    if ('role' in body) {
      const { role } = body;
      if (role !== 'user' && role !== 'admin') {
        return Response.json({ error: 'role must be "user" or "admin"' }, { status: 400 });
      }
      await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, userId));
      return Response.json({ ok: true, userId, role });
    }

    if ('isBanned' in body) {
      const isBanned = Boolean(body.isBanned);
      await db.update(users).set({ isBanned, updatedAt: new Date() }).where(eq(users.id, userId));
      return Response.json({ ok: true, userId, isBanned });
    }

    return Response.json({ error: 'Nothing to update' }, { status: 400 });
  } catch (err) {
    if (err instanceof AuthError) return err.toResponse();
    console.error('[admin/users PATCH]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
