import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';
import { maskProviders } from '@/lib/ai-router';

export async function GET(request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const result = await query(
            'SELECT groq_api_key, ai_providers, settings FROM user_profiles WHERE user_id = $1',
            [session.user.id]
        );

        const profile = result.rows[0] || { groq_api_key: null, ai_providers: {}, settings: {} };
        let aiProviders = profile.ai_providers || {};

        // Backward compat: surface legacy groq key if ai_providers.groq not set
        if (profile.groq_api_key && !aiProviders.groq) {
            aiProviders = {
                ...aiProviders,
                groq: { enabled: true, priority: 1, keys: [profile.groq_api_key] },
            };
        }

        return NextResponse.json({
            success: true,
            profile: {
                // Returns counts only — never key values
                aiProviders: maskProviders(aiProviders),
                settings: profile.settings,
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
        const { action, provider, key, settings, providerMeta } = body;

        // Load current providers
        const existingResult = await query(
            'SELECT ai_providers, groq_api_key FROM user_profiles WHERE user_id = $1',
            [session.user.id]
        );

        let currentProviders = existingResult.rows[0]?.ai_providers || {};
        const hasProfile = existingResult.rows.length > 0;

        // Backward compat: import legacy groq key
        const legacyGroqKey = existingResult.rows[0]?.groq_api_key;
        if (legacyGroqKey && !currentProviders.groq) {
            currentProviders = {
                ...currentProviders,
                groq: { enabled: true, priority: 1, keys: [legacyGroqKey] },
            };
        }

        // ── Action: append a new key to a provider ──────────────────────────
        if (action === 'add-key') {
            if (!provider || !key || typeof key !== 'string') {
                return NextResponse.json({ success: false, error: 'Missing provider or key' }, { status: 400 });
            }
            // Ensure no non-ASCII characters (guard against masked strings)
            if (!/^[\x00-\x7F]+$/.test(key)) {
                return NextResponse.json({ success: false, error: 'Invalid key format' }, { status: 400 });
            }
            const existing = currentProviders[provider] || { enabled: true, priority: 99, keys: [] };
            currentProviders = {
                ...currentProviders,
                [provider]: { ...existing, keys: [...(existing.keys || []), key.trim()] },
            };
        }

        // ── Action: remove a key by index ───────────────────────────────────
        else if (action === 'remove-key') {
            const { index } = body;
            if (!provider || index == null) {
                return NextResponse.json({ success: false, error: 'Missing provider or index' }, { status: 400 });
            }
            const existing = currentProviders[provider];
            if (existing) {
                const keys = [...(existing.keys || [])];
                keys.splice(index, 1);
                currentProviders = { ...currentProviders, [provider]: { ...existing, keys } };
            }
        }

        // ── Action: clear all keys for a provider ───────────────────────────
        else if (action === 'clear-keys') {
            if (!provider) {
                return NextResponse.json({ success: false, error: 'Missing provider' }, { status: 400 });
            }
            const existing = currentProviders[provider] || {};
            currentProviders = { ...currentProviders, [provider]: { ...existing, keys: [] } };
        }

        // ── Action: update provider meta (enabled, priority) ────────────────
        else if (action === 'update-meta') {
            if (!provider || !providerMeta) {
                return NextResponse.json({ success: false, error: 'Missing provider or meta' }, { status: 400 });
            }
            const existing = currentProviders[provider] || { keys: [] };
            currentProviders = {
                ...currentProviders,
                [provider]: { ...existing, ...providerMeta },
            };
        }

        // ── Action: update all provider metas (enabled + priority) at once ──
        else if (action === 'update-all-meta') {
            const { providers } = body;
            for (const [p, meta] of Object.entries(providers || {})) {
                const existing = currentProviders[p] || { keys: [] };
                currentProviders[p] = { ...existing, enabled: meta.enabled, priority: meta.priority };
            }
        }

        // ── Action: update settings ──────────────────────────────────────────
        else if (action === 'update-settings') {
            // handled at end via settings param
        }

        // Mirror first groq key to legacy column
        const firstGroqKey = currentProviders.groq?.keys?.[0] || null;

        if (hasProfile) {
            const updates = ['ai_providers = $1', 'groq_api_key = $2', 'updated_at = NOW()'];
            const values = [currentProviders, firstGroqKey, session.user.id];
            let paramIdx = 3;

            if (settings !== undefined) {
                updates.push(`settings = $${++paramIdx}`);
                values.splice(paramIdx - 1, 0, settings);
                values[values.length - 1] = session.user.id;
            }

            await query(
                `UPDATE user_profiles SET ${updates.join(', ')} WHERE user_id = $${values.length}`,
                values
            );
        } else {
            await query(
                `INSERT INTO user_profiles (user_id, groq_api_key, ai_providers, settings)
                 VALUES ($1, $2, $3, $4)`,
                [session.user.id, firstGroqKey, currentProviders, settings || {}]
            );
        }

        return NextResponse.json({ success: true, message: 'Saved successfully' });
    } catch (error) {
        console.error('Update profile error:', error);
        return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 });
    }
}
