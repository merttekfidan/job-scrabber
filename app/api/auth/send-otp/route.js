import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendOTPEmail } from '@/lib/email';
import { SendOTPSchema, validateBody } from '@/lib/validations';
import { authLimiter, getRateLimitKey } from '@/lib/rate-limit';
import crypto from 'crypto';

export async function POST(req) {
    try {
        // Rate limit by IP + email
        const rateLimitKey = getRateLimitKey(req, 'send-otp');
        const rateLimitResult = authLimiter(rateLimitKey);
        if (!rateLimitResult.success) {
            return NextResponse.json(
                { success: false, error: `Too many requests. Try again in ${rateLimitResult.reset} seconds.` },
                { status: 429 }
            );
        }

        // Validate
        const body = await req.json();
        const validation = validateBody(SendOTPSchema, body);
        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error },
                { status: validation.status }
            );
        }

        const { email } = validation.data;

        // Check user's last_login to apply 90-day bypass
        const userResult = await query('SELECT last_login FROM users WHERE email = $1', [email]);
        const user = userResult.rows[0];

        if (user && user.last_login) {
            const lastLoginDate = new Date(user.last_login);
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

            if (lastLoginDate > ninetyDaysAgo) {
                // User logged in within last 90 days - grant bypass
                const bypassCode = crypto.randomBytes(16).toString('hex');
                const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

                // Invalidate any existing codes
                await query('UPDATE verification_codes SET used = TRUE WHERE email = $1 AND used = FALSE', [email]);

                // Insert bypass code into verification_codes for auth.js to verify
                await query(
                    'INSERT INTO verification_codes (email, code, expires_at) VALUES ($1, $2, $3)',
                    [email, bypassCode, expiresAt]
                );

                return NextResponse.json({
                    success: true,
                    bypass: true,
                    bypassCode,
                });
            }
        }

        // Generate standard 6-digit OTP
        const code = String(Math.floor(100000 + Math.random() * 900000));
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Invalidate any existing codes for this email
        await query(
            'UPDATE verification_codes SET used = TRUE WHERE email = $1 AND used = FALSE',
            [email]
        );

        // Store new code
        await query(
            'INSERT INTO verification_codes (email, code, expires_at) VALUES ($1, $2, $3)',
            [email, code, expiresAt]
        );

        // Send email
        const emailResult = await sendOTPEmail(email, code);

        return NextResponse.json({
            success: true,
            message: 'Verification code sent to your email.',
            isMock: emailResult?.mock === true
        });

    } catch (error) {
        console.error('Send OTP Error full details:', error.stack || error);
        return NextResponse.json(
            { success: false, error: 'Failed to send verification code. ' + error.message },
            { status: 500 }
        );
    }
}
