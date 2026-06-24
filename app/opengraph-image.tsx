import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  const logo = `data:image/png;base64,${readFileSync(join(process.cwd(), 'public', 'rohitt.png')).toString('base64')}`;

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
          gap: 20,
        }}
      >
        {/* Avatar */}
        <img
          src={logo}
          style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '2px solid #222' }}
          alt=""
        />

        {/* Wordmark */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontSize: 88, fontWeight: 800, color: '#ffffff', letterSpacing: '-3px', lineHeight: 1 }}>
            Live
          </span>
          <span style={{ fontSize: 24, color: '#ef4444', fontWeight: 700 }}>●</span>
        </div>

        <div style={{ fontSize: 20, color: '#444', letterSpacing: '0.12em', display: 'flex' }}>
          by rohittcodes
        </div>
      </div>
    ),
    { ...size },
  );
}
