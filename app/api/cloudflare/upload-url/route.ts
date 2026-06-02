import { assertAdmin, AuthError } from '@/lib/auth';
import db from '@/lib/db';
import { videos } from '@/lib/db/schema';

export async function POST(req: Request) {
  try {
    const user = await assertAdmin();
    const { title, description, category, language, tags, thumbnailUrl, fileSize } = await req.json() as {
      title: string;
      description?: string;
      category?: string;
      language?: string;
      tags?: string[];
      thumbnailUrl?: string;
      fileSize: number;
    };

    if (!title?.trim()) return Response.json({ error: 'Title is required' }, { status: 400 });
    if (!Number.isInteger(fileSize) || fileSize <= 0 || fileSize > 10 * 1024 * 1024 * 1024) {
      return Response.json({ error: 'fileSize must be a positive integer no greater than 10 GB' }, { status: 400 });
    }

    // Request a direct TUS upload URL from Cloudflare Stream
    const cfRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/stream?direct_user=true`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_STREAM_API_TOKEN}`,
          'Tus-Resumable': '1.0.0',
          'Upload-Length': String(fileSize),
          'Upload-Metadata': `name ${btoa(title)},requiresignedurls`,
        },
      },
    );

    if (!cfRes.ok) {
      const text = await cfRes.text();
      console.error('[cloudflare upload-url]', text);
      return Response.json({ error: 'Failed to get upload URL from Cloudflare' }, { status: 502 });
    }

    const uploadUrl = cfRes.headers.get('Location');
    const cfVideoId = cfRes.headers.get('stream-media-id');

    if (!uploadUrl || !cfVideoId) {
      return Response.json({ error: 'Missing upload URL from Cloudflare response' }, { status: 502 });
    }

    // Create DB record immediately so we can track status via webhook
    const [video] = await db
      .insert(videos)
      .values({
        hostId: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        category: category || null,
        language: language || 'en',
        tags: tags ?? [],
        thumbnailUrl: thumbnailUrl || null,
        cloudflareVideoId: cfVideoId,
        status: 'queued',
      })
      .returning({ id: videos.id });

    return Response.json({ uploadUrl, videoId: video.id });
  } catch (err) {
    if (err instanceof AuthError) return err.toResponse();
    console.error('[cloudflare upload-url]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
