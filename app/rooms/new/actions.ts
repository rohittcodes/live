'use server';

import { redirect } from 'next/navigation';
import { assertAdmin, AuthError } from '@/lib/auth';
import db from '@/lib/db';
import { audioRooms } from '@/lib/db/schema';

export type CreateRoomResult = { error: string } | { id: string };

export async function createRoom(
  _: CreateRoomResult | null,
  formData: FormData,
): Promise<CreateRoomResult> {
  try {
    const user = await assertAdmin();

    const title = (formData.get('title') as string)?.trim();
    const description = (formData.get('description') as string)?.trim() || null;
    const scheduledRaw = formData.get('scheduledAt') as string | null;
    const scheduledAt = scheduledRaw ? new Date(scheduledRaw) : null;

    if (!title) return { error: 'Title is required.' };
    if (title.length > 120) return { error: 'Title must be 120 characters or fewer.' };

    const [room] = await db
      .insert(audioRooms)
      .values({
        hostId: user.id,
        title,
        description,
        livekitRoomName: `room-${crypto.randomUUID()}`,
        status: 'scheduled',
        scheduledAt,
      })
      .returning({ id: audioRooms.id });

    redirect(`/rooms/${room.id}`);
  } catch (err) {
    if (err instanceof AuthError) return { error: err.message };
    throw err;
  }
}
