import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import db from '@/lib/db';
import { audioRooms, users } from '@/lib/db/schema';
import { AudioRoom } from './room';

export default async function AudioRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();

  const room = await db.query.audioRooms.findFirst({
    where: eq(audioRooms.id, id),
    with: { host: true },
  });

  if (!room) notFound();

  const isHost = userId === room.hostId;
  const type = isHost ? 'host' : 'participant';

  return (
    <div className="flex h-screen flex-col bg-background">
      <AudioRoom room={room} type={type} />
    </div>
  );
}
