import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';
import { Resend } from 'resend';

// Initialize resend if key exists, otherwise it will just log
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request) {
    try {
        const session = await auth();
        const userId = session?.user?.id || null;
        const userEmail = session?.user?.email || 'Anonymous';

        const { feedback, type } = await request.json();

        if (!feedback) {
            return NextResponse.json({ success: false, error: 'Feedback is required' }, { status: 400 });
        }

        // 1. Save to database
        await query(
            'INSERT INTO feedbacks (user_id, email, type, content) VALUES ($1, $2, $3, $4)',
            [userId, userEmail, type || 'general', feedback]
        );

        // 2. Send Email Notification
        if (resend) {
            await resend.emails.send({
                from: 'Feedback <onboarding@resend.dev>', // Default resend testing email
                to: 'merttekfidan@gmail.com', // Admin email
                subject: `New Job Scrabber Feedback: ${type}`,
                html: `
                    <h3>New Feedback Received</h3>
                    <p><strong>From:</strong> ${userEmail}</p>
                    <p><strong>Type:</strong> ${type}</p>
                    <p><strong>Message:</strong></p>
                    <p>${feedback}</p>
                `
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Feedback error:', error);
        return NextResponse.json({ success: false, error: 'Failed to submit feedback' }, { status: 500 });
    }
}
