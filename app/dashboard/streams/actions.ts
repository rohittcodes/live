'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { IngressClient } from 'livekit-server-sdk';
import { RoomServiceClient } from 'livekit-server-sdk';
import { assertAdmin, assertOwnerOrAdmin, AuthError } from '@/lib/auth';
import db from '@/lib/db';
import { streams } from '@/lib/db/schema';

export type ActionResult = { error: string } | { success: true };

export async function deleteStream(_id: string): Promise<ActionResult> {
  try {
    await assertAdmin();
    const stream = await db.query.streams.findFirst({ where: eq(streams.id, _id) });
    if (!stream) return { error: 'Stream not found.' };

    // Remove LiveKit ingress if one exists
    if (stream.ingressId) {
      try {
        const ingress = new IngressClient(
          process.env.NEXT_PUBLIC_LIVEKIT_URL!,
          process.env.LIVEKIT_API_KEY!,
          process.env.LIVEKIT_API_SECRET!,
        );
        await ingress.deleteIngress(stream.ingressId);
      } catch { /* ingress may already be gone */ }
    }

    await db.delete(streams).where(eq(streams.id, _id));
    revalidatePath('/dashboard/streams');
    return { success: true };
  } catch (err) {
    if (err instanceof AuthError) return { error: err.message };
    return { error: 'Something went wrong.' };
  }
}

export async function goLive(id: string): Promise<ActionResult> {
  try {
    const stream = await db.query.streams.findFirst({ where: eq(streams.id, id) });
    if (!stream) return { error: 'Stream not found.' };
    await assertOwnerOrAdmin(stream.hostId);
    await db.update(streams).set({ isLive: true, updatedAt: new Date() }).where(eq(streams.id, id));
    revalidatePath(`/stream/${id}`);
    revalidatePath(`/dashboard/streams/${id}`);
    return { success: true };
  } catch (err) {
    if (err instanceof AuthError) return { error: err.message };
    return { error: 'Something went wrong.' };
  }
}

export async function endStream(id: string): Promise<ActionResult> {
  try {
    const stream = await db.query.streams.findFirst({ where: eq(streams.id, id) });
    if (!stream) return { error: 'Stream not found.' };
    await assertOwnerOrAdmin(stream.hostId);

    await db.update(streams).set({ isLive: false, updatedAt: new Date() }).where(eq(streams.id, id));

    // Disconnect all LiveKit participants
    try {
      if (stream.livekitRoomName) {
        const roomService = new RoomServiceClient(
          process.env.NEXT_PUBLIC_LIVEKIT_URL!,
          process.env.LIVEKIT_API_KEY!,
          process.env.LIVEKIT_API_SECRET!,
        );
        await roomService.deleteRoom(stream.livekitRoomName);
      }
    } catch { /* room may already be empty */ }

    revalidatePath(`/stream/${id}`);
    revalidatePath(`/dashboard/streams/${id}`);
    revalidatePath('/dashboard/streams');
    return { success: true };
  } catch (err) {
    if (err instanceof AuthError) return { error: err.message };
    return { error: 'Something went wrong.' };
  }
}
