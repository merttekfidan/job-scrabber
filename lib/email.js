import { Resend } from 'resend';

let _resend = null;
function getResend() {
    if (!_resend && process.env.RESEND_API_KEY) {
        _resend = new Resend(process.env.RESEND_API_KEY);
    }
    return _resend;
}

/**
 * Send OTP verification email
 * @param {string} email - Recipient email
 * @param {string} code - 6-digit OTP code
 */
export async function sendOTPEmail(email, code) {
    const resend = getResend();
    if (!resend) {
        console.warn('⚠️ RESEND_API_KEY not set. OTP code:', code);
        return { success: true, mock: true };
    }

    const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'Job Scrabber <onboarding@resend.dev>',
        to: email,
        subject: `${code} — Your Job Scrabber login code`,
        html: buildOTPEmailTemplate(code),
    });

    if (error) {
        console.error('Failed to send OTP email:', error);
        throw new Error('Failed to send verification email');
    }

    return { success: true, id: data?.id };
}

function buildOTPEmailTemplate(code) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#0a0a1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <div style="max-width:480px;margin:40px auto;padding:40px 32px;background:linear-gradient(135deg,#111127 0%,#0d0d20 100%);border-radius:16px;border:1px solid rgba(255,255,255,0.06);">
            <!-- Logo -->
            <div style="text-align:center;margin-bottom:32px;">
                <span style="font-size:28px;font-weight:800;background:linear-gradient(135deg,#667eea,#764ba2);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
                    Job Scrabber
                </span>
            </div>

            <!-- Message -->
            <p style="color:#a0a0b8;font-size:15px;line-height:1.6;margin:0 0 24px;text-align:center;">
                Enter this code to sign in to your account:
            </p>

            <!-- OTP Code -->
            <div style="background:rgba(102,126,234,0.08);border:1px solid rgba(102,126,234,0.2);border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
                <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#ffffff;font-family:'Courier New',monospace;">
                    ${code}
                </span>
            </div>

            <!-- Expiry -->
            <p style="color:#666680;font-size:13px;text-align:center;margin:0 0 32px;">
                This code expires in <strong style="color:#a0a0b8;">10 minutes</strong>.
            </p>

            <!-- Footer -->
            <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:20px;text-align:center;">
                <p style="color:#444460;font-size:12px;margin:0;">
                    If you didn't request this code, you can safely ignore this email.
                </p>
            </div>
        </div>
    </body>
    </html>`;
}
