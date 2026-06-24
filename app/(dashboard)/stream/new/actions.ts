'use server';

import { redirect } from 'next/navigation';
import { IngressClient, IngressInput } from 'livekit-server-sdk';
import { assertAdmin, AuthError } from '@/lib/auth';
import db from '@/lib/db';
import { streams } from '@/lib/db/schema';

export type CreateStreamResult = { error: string } | { id: string };

export async function createStream(
  _: CreateStreamResult | null,
  formData: FormData,
): Promise<CreateStreamResult> {
  try {
    const user = await assertAdmin();

    const title = (formData.get('title') as string)?.trim();
    const description = (formData.get('description') as string)?.trim() || null;
    const scheduledAtRaw = (formData.get('scheduledAt') as string)?.trim() || null;

    if (!title) return { error: 'Title is required.' };
    if (title.length > 120) return { error: 'Title must be 120 characters or fewer.' };

    let scheduledAt: Date | null = null;
    if (scheduledAtRaw) {
      scheduledAt = new Date(scheduledAtRaw);
      if (isNaN(scheduledAt.getTime())) return { error: 'Invalid scheduled time.' };
      if (scheduledAt <= new Date()) return { error: 'Scheduled time must be in the future.' };
    }

    const roomName = `stream-${crypto.randomUUID()}`;

    // Provision LiveKit RTMP ingress
    const ingress = new IngressClient(
      process.env.NEXT_PUBLIC_LIVEKIT_URL!,
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!,
    );

    const ingressInfo = await ingress.createIngress(IngressInput.RTMP_INPUT, {
      name: title,
      roomName,
      participantIdentity: user.id,
      participantName: user.name,
    });

    const [stream] = await db
      .insert(streams)
      .values({
        hostId: user.id,
        title,
        description,
        scheduledAt,
        livekitRoomName: roomName,
        ingressId: ingressInfo.ingressId,
        rtmpUrl: ingressInfo.url ?? null,
        streamKey: ingressInfo.streamKey ?? crypto.randomUUID(),
      })
      .returning({ id: streams.id });

    redirect(`/dashboard/streams/${stream.id}`);
  } catch (err) {
    if (err instanceof AuthError) return { error: err.message };
    // redirect() throws internally — rethrow it
    throw err;
  }
}
