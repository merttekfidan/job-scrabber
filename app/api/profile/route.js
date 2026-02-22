import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';

export async function GET(request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const result = await query(
            'SELECT groq_api_key, settings FROM user_profiles WHERE user_id = $1',
            [session.user.id]
        );

        const profile = result.rows[0] || { groq_api_key: null, settings: {} };

        // Mask the API key before sending to client
        let maskedKey = null;
        if (profile.groq_api_key) {
            const keyLength = profile.groq_api_key.length;
            maskedKey = keyLength > 8
                ? profile.groq_api_key.substring(0, 4) + '*'.repeat(keyLength - 8) + profile.groq_api_key.substring(keyLength - 4)
                : '********';
        }

        return NextResponse.json({
            success: true,
            profile: {
                hasGroqKey: !!profile.groq_api_key,
                maskedGroqKey: maskedKey,
                settings: profile.settings
            }
        });
    } catch (error) {
        console.error('Fetch profile error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch profile' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { groqApiKey, settings } = body;

        // Upsert logic
        let sql, values;

        const existingResult = await query('SELECT 1 FROM user_profiles WHERE user_id = $1', [session.user.id]);

        if (existingResult.rows.length > 0) {
            // Update
            const updates = [];
            const values = [];
            let paramIndex = 1;

            if (groqApiKey !== undefined) {
                updates.push(`groq_api_key = $${paramIndex++}`);
                values.push(groqApiKey === '' ? null : groqApiKey);
            }
            if (settings !== undefined) {
                updates.push(`settings = $${paramIndex++}`);
                values.push(settings);
            }

            if (updates.length === 0) {
                return NextResponse.json({ success: true, message: 'Nothing to update' });
            }

            updates.push(`updated_at = NOW()`);
            values.push(session.user.id);

            sql = `UPDATE user_profiles SET ${updates.join(', ')} WHERE user_id = $${paramIndex} RETURNING *`;
            await query(sql, values);
        } else {
            // Insert
            sql = `
                INSERT INTO user_profiles (user_id, groq_api_key, settings)
                VALUES ($1, $2, $3)
            `;
            values = [
                session.user.id,
                groqApiKey === '' ? null : (groqApiKey || null),
                settings || {}
            ];
            await query(sql, values);
        }

        return NextResponse.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update profile error:', error);
        return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 });
    }
}
