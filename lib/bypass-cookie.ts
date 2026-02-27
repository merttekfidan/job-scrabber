import crypto from 'crypto';

const SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-production';
const COOKIE_MAX_AGE = 5 * 60; // 5 minutes

export interface BypassPayload {
  email: string;
  codeId: number;
  exp: number;
}

export function signBypassPayload(payload: BypassPayload): string {
  const data = JSON.stringify(payload);
  const hmac = crypto.createHmac('sha256', SECRET);
  hmac.update(data);
  const sig = hmac.digest('base64url');
  return `${Buffer.from(data, 'utf8').toString('base64url')}.${sig}`;
}

export function verifyBypassPayload(token: string): BypassPayload | null {
  try {
    const [raw, sig] = token.split('.');
    if (!raw || !sig) return null;
    const data = Buffer.from(raw, 'base64url').toString('utf8');
    const payload = JSON.parse(data) as BypassPayload;
    const expected = signBypassPayload({ ...payload }).split('.')[1];
    if (expected !== sig || payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getBypassCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  };
}
