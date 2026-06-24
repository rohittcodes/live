import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';
import { eq, or } from 'drizzle-orm';
import db from '@/lib/db';
import { users } from '@/lib/db/schema';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { id: string } }) {
  const [creator, logoBuffer] = await Promise.all([
    db.query.users.findFirst({ where: or(eq(users.username, params.id), eq(users.id, params.id)) }),
    Promise.resolve(readFileSync(join(process.cwd(), 'public', 'rohitt.png'))),
  ]);
  const logo = `data:image/png;base64,${logoBuffer.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          background: '#0a0a0a',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 22,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle at 50% 40%, rgba(255,255,255,0.03) 0%, transparent 60%)',
            display: 'flex',
          }}
        />

        {/* Brand */}
        <div style={{ position: 'absolute', top: 44, right: 56, display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={logo} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} alt="" />
          <span style={{ fontSize: 18, color: '#333' }}>live · rohittcodes</span>
        </div>

        {/* Creator avatar */}
        {creator?.imageUrl ? (
          <img
            src={creator.imageUrl}
            style={{ width: 130, height: 130, borderRadius: '50%', objectFit: 'cover', border: '3px solid #222' }}
            alt=""
          />
        ) : (
          <img
            src={logo}
            style={{ width: 130, height: 130, borderRadius: '50%', objectFit: 'cover', border: '3px solid #222' }}
            alt=""
          />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 54, fontWeight: 700, color: 'white', display: 'flex' }}>
            {creator?.name ?? ''}
          </div>
          {creator?.username && (
            <div style={{ fontSize: 24, color: '#555', display: 'flex' }}>@{creator.username}</div>
          )}
        </div>
      </div>
    ),
    { ...size },
  );
}
