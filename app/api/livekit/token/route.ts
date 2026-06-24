import { AccessToken } from 'livekit-server-sdk';
import { NextRequest } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { assertAuth, AuthError } from '@/lib/auth';
import db from '@/lib/db';
import { streams, audioRooms, streamMembers, streamBans, users } from '@/lib/db/schema';
import { viewerTokenLimiter, getIp } from '@/lib/ratelimit';

export async function GET(req: NextRequest) {
  try {
    const room = req.nextUrl.searchParams.get('room');
    const type = req.nextUrl.searchParams.get('type') ?? 'viewer';

    if (!room) return Response.json({ error: 'Missing room' }, { status: 400 });

    if (type === 'host') {
      // Hosts must be signed in and must actually own the stream/room.
      const user = await assertAuth();
      if (user.isBanned) return Response.json({ error: 'Account banned' }, { status: 403 });

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
      if (user.isBanned) return Response.json({ error: 'Account banned' }, { status: 403 });

      // Audio room participant
      const audioRoom = await db.query.audioRooms.findFirst({
        where: eq(audioRooms.livekitRoomName, room),
      });
      if (audioRoom) {
        if (audioRoom.status === 'ended') {
          return Response.json({ error: 'Room has ended' }, { status: 410 });
        }
        if (audioRoom.status === 'scheduled' && audioRoom.hostId !== user.id) {
          return Response.json({ error: 'Room has not started yet' }, { status: 425 });
        }
        const isRoomHost = audioRoom.hostId === user.id;
        const at = new AccessToken(
          process.env.LIVEKIT_API_KEY!,
          process.env.LIVEKIT_API_SECRET!,
          { identity: user.id, name: user.name, ttl: '4h' },
        );
        at.addGrant({
          room,
          roomJoin: true,
          canPublish: isRoomHost || audioRoom.status === 'active',
          canPublishData: true,
          canSubscribe: true,
        });
        return Response.json({ token: await at.toJwt() });
      }

      // Stream speaker — must be an accepted member and not banned
      const stream = await db.query.streams.findFirst({
        where: eq(streams.livekitRoomName, room),
      });
      if (!stream) return Response.json({ error: 'Room not found' }, { status: 404 });

      const [member, streamBan] = await Promise.all([
        db.query.streamMembers.findFirst({
          where: and(eq(streamMembers.streamId, stream.id), eq(streamMembers.userId, user.id)),
        }),
        db.query.streamBans.findFirst({
          where: and(eq(streamBans.streamId, stream.id), eq(streamBans.userId, user.id)),
        }),
      ]);
      if (streamBan) return Response.json({ error: 'You are banned from this stream' }, { status: 403 });
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
    if (viewerTokenLimiter) {
      const ip = getIp(req.headers);
      const { success } = await viewerTokenLimiter.limit(ip);
      if (!success) return Response.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { auth } = await import('@clerk/nextjs/server');
    const { userId } = await auth();

    const streamRecord = await db.query.streams.findFirst({ where: eq(streams.livekitRoomName, room) });
    if (!streamRecord) return Response.json({ error: 'Stream not found' }, { status: 404 });

    // Reject platform-banned or stream-banned authenticated users
    if (userId) {
      const [viewerUser, streamBan] = await Promise.all([
        db.query.users.findFirst({ where: eq(users.id, userId) }),
        db.query.streamBans.findFirst({
          where: and(eq(streamBans.streamId, streamRecord.id), eq(streamBans.userId, userId)),
        }),
      ]);
      if (viewerUser?.isBanned) return Response.json({ error: 'Account banned' }, { status: 403 });
      if (streamBan) return Response.json({ error: 'You are banned from this stream' }, { status: 403 });
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

    const identity = userId ?? `anon-${crypto.randomUUID()}`;

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
