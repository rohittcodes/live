'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { RoomServiceClient } from 'livekit-server-sdk';
import { assertOwnerOrAdmin, AuthError } from '@/lib/auth';
import db from '@/lib/db';
import { audioRooms } from '@/lib/db/schema';

export async function startRoom(id: string) {
  try {
    const room = await db.query.audioRooms.findFirst({ where: eq(audioRooms.id, id) });
    if (!room) throw new AuthError(404 as never, 'Room not found');
    await assertOwnerOrAdmin(room.hostId);
    await db.update(audioRooms).set({ status: 'active', startedAt: new Date(), updatedAt: new Date() }).where(eq(audioRooms.id, id));
    revalidatePath(`/rooms/${id}`);
  } catch (err) { if (err instanceof AuthError) throw err; }
}

export async function endRoom(id: string) {
  try {
    const room = await db.query.audioRooms.findFirst({ where: eq(audioRooms.id, id) });
    if (!room) throw new AuthError(404 as never, 'Room not found');
    await assertOwnerOrAdmin(room.hostId);

    await db.update(audioRooms).set({ status: 'ended', endedAt: new Date(), updatedAt: new Date() }).where(eq(audioRooms.id, id));

    // Kick all LiveKit participants
    try {
      const roomService = new RoomServiceClient(
        process.env.NEXT_PUBLIC_LIVEKIT_URL!,
        process.env.LIVEKIT_API_KEY!,
        process.env.LIVEKIT_API_SECRET!,
      );
      await roomService.deleteRoom(room.livekitRoomName);
    } catch { /* room may already be empty */ }

    revalidatePath(`/rooms/${id}`);
    revalidatePath('/rooms');
  } catch (err) { if (err instanceof AuthError) throw err; }
}
