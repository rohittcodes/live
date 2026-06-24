import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';
import { eq } from 'drizzle-orm';
import db from '@/lib/db';
import { videos } from '@/lib/db/schema';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { id: string } }) {
  const [video, logoBuffer] = await Promise.all([
    db.query.videos.findFirst({ where: eq(videos.id, params.id), with: { host: true } }),
    Promise.resolve(readFileSync(join(process.cwd(), 'public', 'rohitt.png'))),
  ]);
  const logo = `data:image/png;base64,${logoBuffer.toString('base64')}`;

  const subdomain = process.env.CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN;
  const thumb =
    video?.thumbnailUrl ??
    (subdomain && video?.cloudflareVideoId
      ? `https://customer-${subdomain}.cloudflarestream.com/${video.cloudflareVideoId}/thumbnails/thumbnail.jpg`
      : null);

  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', background: '#0a0a0a', position: 'relative' }}>
        {thumb && (
          <img
            src={thumb}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }}
            alt=""
          />
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.3) 55%, transparent 100%)',
            display: 'flex',
          }}
        />

        {/* Brand */}
        <div style={{ position: 'absolute', top: 44, right: 56, display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={logo} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} alt="" />
          <span style={{ fontSize: 18, color: '#555' }}>live · rohittcodes</span>
        </div>

        <div style={{ position: 'absolute', bottom: 60, left: 64, right: 64, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            style={{
              fontSize: 58,
              fontWeight: 700,
              color: 'white',
              lineHeight: 1.15,
              display: 'flex',
              flexWrap: 'wrap',
              maxWidth: '900px',
            }}
          >
            {video?.title ?? 'Video'}
          </div>
          <div style={{ fontSize: 24, color: '#888', display: 'flex' }}>
            {video?.host.name ?? ''}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
