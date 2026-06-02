import { verifyWebhook } from '@clerk/nextjs/webhooks';
import { eq } from 'drizzle-orm';
import { type NextRequest } from 'next/server';
import db from '@/lib/db';
import { users } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
  try {
    const evt = await verifyWebhook(request);

    if (evt.type === 'user.created' || evt.type === 'user.updated') {
      const { id, first_name, last_name, username, email_addresses, image_url } = evt.data;
      const name = [first_name, last_name].filter(Boolean).join(' ') || 'Anonymous';
      const email = email_addresses[0]?.email_address ?? '';

      try {
        await db
          .insert(users)
          .values({ id, name, username: username ?? null, email, imageUrl: image_url })
          .onConflictDoUpdate({
            target: users.id,
            set: { name, username: username ?? null, email, imageUrl: image_url, updatedAt: new Date() },
          });
      } catch (syncErr) {
        // Unique constraint on email/username — log and continue so webhook returns 200
        // (prevents Clerk retry loops when a duplicate exists)
        console.error('[clerk webhook] user sync conflict, skipping:', id, syncErr);
      }
    }

    if (evt.type === 'user.deleted' && evt.data.id) {
      await db.delete(users).where(eq(users.id, evt.data.id));
    }

    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return new Response('Webhook verification failed', { status: 400 });
  }
}
