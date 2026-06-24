import { Resend } from 'resend';

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY ?? '');
  return _resend;
}

const FROM = process.env.RESEND_FROM ?? 'Live Platform <noreply@live.rohit.dev>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'rohittcodes@gmail.com';

function html(body: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:system-ui,-apple-system,sans-serif;background:#f9fafb;margin:0;padding:32px 16px}table{max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb}td{padding:28px 32px}h1{margin:0 0 8px;font-size:20px;font-weight:700;color:#111827}p{margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6}.btn{display:inline-block;padding:10px 20px;background:#111827;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600}.muted{color:#6b7280;font-size:13px}</style></head><body><table><tr><td>${body}</td></tr></table></body></html>`;
}

export async function sendJoinRequestReceivedEmail({
  streamTitle,
  requesterName,
  streamId,
}: {
  streamTitle: string;
  requesterName: string;
  streamId: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return getResend().emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `Join request: ${requesterName} wants to join "${streamTitle}"`,
    html: html(`
      <h1>New join request</h1>
      <p><strong>${requesterName}</strong> is requesting to join your stream <strong>"${streamTitle}"</strong>.</p>
      <a class="btn" href="${appUrl}/dashboard/streams/${streamId}">Review request</a>
    `),
  });
}

export async function sendJoinRequestResponseEmail({
  to,
  userName,
  streamTitle,
  status,
  streamId,
}: {
  to: string;
  userName: string;
  streamTitle: string;
  status: 'accepted' | 'rejected';
  streamId: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const accepted = status === 'accepted';
  return getResend().emails.send({
    from: FROM,
    to,
    subject: accepted
      ? `You're in! Your request to join "${streamTitle}" was approved`
      : `Your request to join "${streamTitle}" was declined`,
    html: html(`
      <h1>${accepted ? "You're approved!" : 'Request declined'}</h1>
      <p>Hi ${userName},</p>
      <p>Your request to join the stream <strong>"${streamTitle}"</strong> was <strong>${status}</strong>.</p>
      ${accepted ? `<a class="btn" href="${appUrl}/stream/${streamId}">Watch the stream</a>` : '<p class="muted">You may request again if you think this was a mistake.</p>'}
    `),
  });
}

export async function sendRecordingReadyEmail({
  streamTitle,
  videoId,
}: {
  streamTitle: string;
  videoId: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return getResend().emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `Recording ready: "${streamTitle}"`,
    html: html(`
      <h1>Recording is ready</h1>
      <p>Your stream <strong>"${streamTitle}"</strong> has been processed and is ready to watch.</p>
      <a class="btn" href="${appUrl}/videos/${videoId}">Watch recording</a>
      <p class="muted" style="margin-top:16px">You can publish it from the dashboard to make it visible to everyone.</p>
    `),
  });
}

export async function sendGoLiveEmail({
  to,
  userName,
  streamTitle,
  streamId,
}: {
  to: string;
  userName: string;
  streamTitle: string;
  streamId: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `🔴 ${streamTitle} is live now`,
    html: html(`
      <h1>Stream is live!</h1>
      <p>Hi ${userName},</p>
      <p><strong>"${streamTitle}"</strong> just went live. Join now to watch and interact.</p>
      <a class="btn" href="${appUrl}/stream/${streamId}">Watch now</a>
    `),
  });
}

export async function sendWelcomeEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return getResend().emails.send({
    from: FROM,
    to,
    subject: 'Welcome to Live!',
    html: html(`
      <h1>Welcome, ${name}!</h1>
      <p>Thanks for joining. You can watch live streams, browse videos, and join the community.</p>
      <a class="btn" href="${appUrl}">Go to the platform</a>
    `),
  });
}
