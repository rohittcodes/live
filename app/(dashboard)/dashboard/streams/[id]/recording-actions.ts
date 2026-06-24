'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { EgressClient, EncodedFileOutput, EncodedFileType, S3Upload } from 'livekit-server-sdk';
import { assertOwnerOrAdmin, AuthError } from '@/lib/auth';
import db from '@/lib/db';
import { streams } from '@/lib/db/schema';

export type ActionResult = { error: string } | { success: true };

function egressClient() {
  return new EgressClient(
    process.env.NEXT_PUBLIC_LIVEKIT_URL!,
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
  );
}

export async function startRecording(streamId: string): Promise<ActionResult> {
  try {
    const stream = await db.query.streams.findFirst({ where: eq(streams.id, streamId) });
    if (!stream) return { error: 'Stream not found.' };
    if (!stream.isLive) return { error: 'Stream is not live.' };
    if (!stream.livekitRoomName) return { error: 'No LiveKit room associated.' };
    if (stream.egressId) return { error: 'Recording already in progress.' };

    await assertOwnerOrAdmin(stream.hostId);

    const output = new EncodedFileOutput({
      fileType: EncodedFileType.MP4,
      filepath: `recordings/${streamId}`,
      output: {
        case: 's3',
        value: new S3Upload({
          accessKey: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
          secret: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
          endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!,
          bucket: process.env.CLOUDFLARE_R2_BUCKET!,
          region: 'auto',
          forcePathStyle: true,
        }),
      },
    });

    const egress = await egressClient().startRoomCompositeEgress(stream.livekitRoomName, output);

    await db.update(streams).set({
      egressId: egress.egressId,
      recordingStatus: 'starting',
      updatedAt: new Date(),
    }).where(eq(streams.id, streamId));

    revalidatePath(`/dashboard/streams/${streamId}`);
    revalidatePath(`/stream/${streamId}`);
    return { success: true };
  } catch (err) {
    if (err instanceof AuthError) return { error: err.message };
    console.error('[startRecording]', err);
    return { error: 'Failed to start recording.' };
  }
}

export async function stopRecording(streamId: string): Promise<ActionResult> {
  try {
    const stream = await db.query.streams.findFirst({ where: eq(streams.id, streamId) });
    if (!stream) return { error: 'Stream not found.' };
    if (!stream.egressId) return { error: 'No active recording.' };

    await assertOwnerOrAdmin(stream.hostId);

    await egressClient().stopEgress(stream.egressId);

    await db.update(streams).set({
      recordingStatus: 'ending',
      updatedAt: new Date(),
    }).where(eq(streams.id, streamId));

    revalidatePath(`/dashboard/streams/${streamId}`);
    revalidatePath(`/stream/${streamId}`);
    return { success: true };
  } catch (err) {
    if (err instanceof AuthError) return { error: err.message };
    console.error('[stopRecording]', err);
    return { error: 'Failed to stop recording.' };
  }
}
