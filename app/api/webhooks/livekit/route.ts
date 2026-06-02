import { WebhookReceiver, EgressStatus } from 'livekit-server-sdk';
import { eq } from 'drizzle-orm';
import { type NextRequest } from 'next/server';
import db from '@/lib/db';
import { streams, audioRooms, videos } from '@/lib/db/schema';

const receiver = new WebhookReceiver(
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!,
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const authorization = req.headers.get('Authorization') ?? '';

  try {
    const event = await receiver.receive(body, authorization);

    switch (event.event) {
      // RTMP ingress connected → mark stream live
      case 'ingress_started': {
        const ingressId = event.ingressInfo?.ingressId;
        if (ingressId) {
          await db
            .update(streams)
            .set({ isLive: true, updatedAt: new Date() })
            .where(eq(streams.ingressId, ingressId));
        }
        break;
      }

      // RTMP ingress disconnected → mark stream offline
      case 'ingress_ended': {
        const ingressId = event.ingressInfo?.ingressId;
        if (ingressId) {
          await db
            .update(streams)
            .set({ isLive: false, updatedAt: new Date() })
            .where(eq(streams.ingressId, ingressId));
        }
        break;
      }

      // Room finished → sync audio room and stream status
      case 'room_finished': {
        const roomName = event.room?.name;
        if (roomName) {
          await db
            .update(audioRooms)
            .set({ status: 'ended', endedAt: new Date(), updatedAt: new Date() })
            .where(eq(audioRooms.livekitRoomName, roomName));

          await db
            .update(streams)
            .set({ isLive: false, updatedAt: new Date() })
            .where(eq(streams.livekitRoomName, roomName));
        }
        break;
      }

      case 'track_published': {
        const roomName = event.room?.name;
        if (roomName && roomName.startsWith('stream-')) {
          await db
            .update(streams)
            .set({ isLive: true, updatedAt: new Date() })
            .where(eq(streams.livekitRoomName, roomName));
        }
        break;
      }

      case 'egress_started': {
        const egressId = event.egressInfo?.egressId;
        if (egressId) {
          await db.update(streams)
            .set({ recordingStatus: 'active', updatedAt: new Date() })
            .where(eq(streams.egressId, egressId));
        }
        break;
      }

      case 'egress_ended': {
        const info = event.egressInfo;
        if (!info?.egressId) break;

        const failed = info.status !== EgressStatus.EGRESS_COMPLETE;
        const r2Url = info.fileResults?.[0]?.location
          ? buildR2PublicUrl(info.fileResults[0].location)
          : null;

        if (failed || !r2Url) {
          await db.update(streams).set({
            recordingStatus: 'failed',
            egressId: null,
            updatedAt: new Date(),
          }).where(eq(streams.egressId, info.egressId));
          break;
        }

        // Look up stream to get title + hostId for the video record
        const stream = await db.query.streams.findFirst({
          where: eq(streams.egressId, info.egressId),
        });
        if (!stream) break;

        // Copy the R2 file into Cloudflare Stream
        const cfVideoId = await copyToCloudflareStream(r2Url, stream.title);

        if (!cfVideoId) {
          // CF copy failed — keep r2Url as fallback
          await db.update(streams).set({
            recordingStatus: 'complete',
            recordingUrl: r2Url,
            egressId: null,
            updatedAt: new Date(),
          }).where(eq(streams.id, stream.id));
          break;
        }

        // Create a videos record so it shows up like any other video
        const [video] = await db.insert(videos).values({
          hostId: stream.hostId,
          title: stream.title,
          description: stream.description ?? null,
          category: stream.category ?? null,
          tags: stream.tags ?? [],
          cloudflareVideoId: cfVideoId,
          status: 'queued',
          isPublished: false, // Cloudflare webhook flips this once ready
        }).returning({ id: videos.id });

        // Point the stream recording at the video page
        await db.update(streams).set({
          recordingStatus: 'complete',
          recordingUrl: `/videos/${video.id}`,
          egressId: null,
          updatedAt: new Date(),
        }).where(eq(streams.id, stream.id));

        break;
      }
    }

    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error('[livekit webhook]', err);
    return new Response('Webhook verification failed', { status: 400 });
  }
}

// Converts s3://bucket/path → public R2 URL
function buildR2PublicUrl(s3Location: string): string | null {
  try {
    const withoutScheme = s3Location.replace(/^s3:\/\/[^/]+\//, '');
    const base = process.env.CLOUDFLARE_R2_PUBLIC_URL;
    if (!base) return null;
    return `${base.replace(/\/$/, '')}/${withoutScheme}`;
  } catch {
    return null;
  }
}

// Calls Cloudflare Stream "copy from URL" API and returns the CF video UID
async function copyToCloudflareStream(url: string, name: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/stream/copy`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_STREAM_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, meta: { name } }),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      console.error('[copyToCloudflareStream] CF error:', text);
      return null;
    }

    const data = await res.json() as { success: boolean; result?: { uid: string } };
    return data.success ? (data.result?.uid ?? null) : null;
  } catch (err) {
    console.error('[copyToCloudflareStream]', err);
    return null;
  }
}
