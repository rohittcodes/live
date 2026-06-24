import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';
import { eq } from 'drizzle-orm';
import db from '@/lib/db';
import { streams } from '@/lib/db/schema';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { id: string } }) {
  const [stream, logoBuffer] = await Promise.all([
    db.query.streams.findFirst({ where: eq(streams.id, params.id), with: { host: true } }),
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
          padding: '60px',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle at 15% 50%, rgba(239,68,68,0.07) 0%, transparent 55%)',
            display: 'flex',
          }}
        />

        {/* Brand: avatar + name */}
        <div style={{ position: 'absolute', top: 44, right: 56, display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={logo} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} alt="" />
          <span style={{ fontSize: 18, color: '#444' }}>live · rohittcodes</span>
        </div>

        {stream?.isLive && (
          <div style={{ display: 'flex', background: '#ef4444', borderRadius: 6, padding: '4px 14px', marginBottom: 20, width: 'fit-content' }}>
            <span style={{ color: 'white', fontSize: 18, fontWeight: 700, letterSpacing: '0.06em' }}>● LIVE</span>
          </div>
        )}

        <div
          style={{
            fontSize: 60,
            fontWeight: 700,
            color: 'white',
            lineHeight: 1.15,
            marginBottom: 14,
            display: 'flex',
            flexWrap: 'wrap',
            maxWidth: '900px',
          }}
        >
          {stream?.title ?? 'Stream'}
        </div>

        <div style={{ fontSize: 24, color: '#666', display: 'flex', gap: 10 }}>
          <span>{stream?.host.name ?? ''}</span>
          {stream?.category && <span style={{ color: '#444' }}>· {stream.category}</span>}
        </div>
      </div>
    ),
    { ...size },
  );
}
