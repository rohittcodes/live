import { assertAdmin, AuthError } from '@/lib/auth';

// Accepts a multipart/form-data body with a `file` field.
// Uploads to Cloudflare Images and returns the public URL.
export async function POST(req: Request) {
  try {
    await assertAdmin();

    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) return Response.json({ error: 'No file provided' }, { status: 400 });

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      return Response.json({ error: 'File must be JPEG, PNG, WebP, or GIF' }, { status: 400 });
    }

    const cfForm = new FormData();
    cfForm.append('file', file);

    const cfRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v1`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_IMAGES_TOKEN}` },
        body: cfForm,
      },
    );

    if (!cfRes.ok) {
      const body = await cfRes.json();
      console.error('[cloudflare/thumbnail]', body);
      return Response.json({ error: 'Cloudflare Images upload failed' }, { status: 502 });
    }

    const { result } = await cfRes.json();
    // Cloudflare Images URL pattern: https://imagedelivery.net/<account_hash>/<image_id>/public
    const url: string = result.variants[0];
    return Response.json({ url });
  } catch (err) {
    if (err instanceof AuthError) return err.toResponse();
    console.error('[cloudflare/thumbnail]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
