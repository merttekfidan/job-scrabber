import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendOTPEmail } from '@/lib/email';
import { SendOTPSchema, validateBody } from '@/lib/validations';
import { authLimiter, getRateLimitKey } from '@/lib/rate-limit';
import crypto from 'crypto';
import { signBypassPayload, getBypassCookieOptions } from '@/lib/bypass-cookie';

export async function POST(req: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('[SendOTP] DATABASE_URL is not configured');
      return NextResponse.json(
        { success: false, error: 'Server configuration error. Please try again later.' },
        { status: 503 }
      );
    }

    const rateLimitKey = getRateLimitKey(req, 'send-otp');
    const rateLimitResult = authLimiter(rateLimitKey);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: `Too many requests. Try again in ${rateLimitResult.reset} seconds.` },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => {
      console.error('[SendOTP] Invalid JSON body');
      return null;
    });
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }
    const validation = validateBody(SendOTPSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: validation.status }
      );
    }

    const { email } = validation.data;

    const userResult = await query('SELECT last_login FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0] as { last_login: Date } | undefined;

    if (user?.last_login) {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      if (new Date(user.last_login) > ninetyDaysAgo) {
        const bypassCode = crypto.randomBytes(16).toString('hex');
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await query('UPDATE verification_codes SET used = TRUE WHERE email = $1 AND used = FALSE', [email]);
        const insertResult = await query(
          'INSERT INTO verification_codes (email, code, expires_at) VALUES ($1, $2, $3) RETURNING id',
          [email, bypassCode, expiresAt]
        );
        const row = insertResult.rows[0] as { id: number };
        const codeId = row.id;

        const payload = {
          email,
          codeId,
          exp: Math.floor(Date.now() / 1000) + 5 * 60,
        };
        const token = signBypassPayload(payload);
        const opts = getBypassCookieOptions();
        const response = NextResponse.json({ success: true, bypass: true });
        response.cookies.set('bypass_pending', token, opts);
        return response;
      }
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await query('UPDATE verification_codes SET used = TRUE WHERE email = $1 AND used = FALSE', [email]);
    await query(
      'INSERT INTO verification_codes (email, code, expires_at) VALUES ($1, $2, $3)',
      [email, code, expiresAt]
    );

    const emailResult = await sendOTPEmail(email, code);

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email.',
      isMock: emailResult?.mock === true,
    });
  } catch (error) {
    const err = error as Error;
    const msg = err?.message || 'Failed to send verification code.';
    console.error('[SendOTP] Error:', err?.stack || err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

