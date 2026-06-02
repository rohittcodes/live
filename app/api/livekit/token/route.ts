import { AccessToken } from 'livekit-server-sdk';
import { NextRequest } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { assertAuth, AuthError } from '@/lib/auth';
import db from '@/lib/db';
import { streams, audioRooms, streamMembers, streamBans } from '@/lib/db/schema';

export async function GET(req: NextRequest) {
  try {
    const room = req.nextUrl.searchParams.get('room');
    const type = req.nextUrl.searchParams.get('type') ?? 'viewer';

    if (!room) return Response.json({ error: 'Missing room' }, { status: 400 });

    if (type === 'host') {
      // Hosts must be signed in and must actually own the stream/room.
      const user = await assertAuth();

      const [stream, audioRoom] = await Promise.all([
        db.query.streams.findFirst({ where: eq(streams.livekitRoomName, room) }),
        db.query.audioRooms.findFirst({ where: eq(audioRooms.livekitRoomName, room) }),
      ]);

      const resource = stream ?? audioRoom;
      if (!resource) return Response.json({ error: 'Room not found' }, { status: 404 });
      if (resource.hostId !== user.id) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }

      const at = new AccessToken(
        process.env.LIVEKIT_API_KEY!,
        process.env.LIVEKIT_API_SECRET!,
        { identity: user.id, name: user.name, ttl: '4h' },
      );
      at.addGrant({
        room,
        roomJoin: true,
        canPublish: true,
        canPublishData: true,
        canSubscribe: true,
        roomAdmin: true,
      });
      return Response.json({ token: await at.toJwt() });
    }

    if (type === 'participant') {
      const user = await assertAuth();

      // Audio room participant
      const audioRoom = await db.query.audioRooms.findFirst({
        where: eq(audioRooms.livekitRoomName, room),
      });
      if (audioRoom) {
        if (audioRoom.status === 'ended') {
          return Response.json({ error: 'Room has ended' }, { status: 410 });
        }
        const at = new AccessToken(
          process.env.LIVEKIT_API_KEY!,
          process.env.LIVEKIT_API_SECRET!,
          { identity: user.id, name: user.name, ttl: '4h' },
        );
        at.addGrant({ room, roomJoin: true, canPublish: true, canPublishData: true, canSubscribe: true });
        return Response.json({ token: await at.toJwt() });
      }

      // Stream speaker — must be an accepted member
      const stream = await db.query.streams.findFirst({
        where: eq(streams.livekitRoomName, room),
      });
      if (!stream) return Response.json({ error: 'Room not found' }, { status: 404 });

      const member = await db.query.streamMembers.findFirst({
        where: and(eq(streamMembers.streamId, stream.id), eq(streamMembers.userId, user.id)),
      });
      if (!member || member.status !== 'accepted') {
        return Response.json({ error: 'Not an accepted speaker' }, { status: 403 });
      }

      const at = new AccessToken(
        process.env.LIVEKIT_API_KEY!,
        process.env.LIVEKIT_API_SECRET!,
        { identity: user.id, name: user.name, ttl: '4h' },
      );
      at.addGrant({ room, roomJoin: true, canPublish: true, canPublishData: true, canSubscribe: true });
      return Response.json({ token: await at.toJwt() });
    }

    // Viewer — public, no sign-in required
    const { auth } = await import('@clerk/nextjs/server');
    const { userId } = await auth();

    const streamRecord = await db.query.streams.findFirst({ where: eq(streams.livekitRoomName, room) });
    if (!streamRecord) return Response.json({ error: 'Stream not found' }, { status: 404 });

    // Reject banned authenticated users
    if (userId) {
      const ban = await db.query.streamBans.findFirst({
        where: and(eq(streamBans.streamId, streamRecord.id), eq(streamBans.userId, userId)),
      });
      if (ban) return Response.json({ error: 'You are banned from this stream' }, { status: 403 });
    }

    // Members-only streams require an accepted membership
    if (streamRecord.isMembersOnly) {
      if (!userId) return Response.json({ error: 'Sign in to join this stream' }, { status: 401 });
      const member = await db.query.streamMembers.findFirst({
        where: and(eq(streamMembers.streamId, streamRecord.id), eq(streamMembers.userId, userId)),
      });
      if (!member || member.status !== 'accepted') {
        return Response.json({ error: 'This stream is members only' }, { status: 403 });
      }
    }

    const identity = userId ?? `anon-${crypto.randomUUID().slice(0, 8)}`;

    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!,
      { identity, ttl: '4h' },
    );
    at.addGrant({
      room,
      roomJoin: true,
      canPublish: false,
      canPublishData: true,
      canSubscribe: true,
    });
    return Response.json({ token: await at.toJwt() });
  } catch (err) {
    if (err instanceof AuthError) return err.toResponse();
    console.error('[livekit/token]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
