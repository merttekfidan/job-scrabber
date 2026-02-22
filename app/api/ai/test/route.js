import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';
import { PROVIDER_CONFIGS } from '@/lib/ai-router';

const TEST_PROMPT = 'Reply with exactly one word: OK';

async function testProvider(providerKey, apiKey) {
    const config = PROVIDER_CONFIGS[providerKey];
    const start = Date.now();

    try {
        let response;

        if (config.type === 'gemini') {
            const model = config.models[0];
            const url = `${config.endpoint.replace('{model}', model)}?key=${apiKey}`;
            response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: TEST_PROMPT }] }],
                    generationConfig: { maxOutputTokens: 10 },
                }),
            });
        } else {
            // OpenAI-compat (Groq, OpenRouter)
            response = await fetch(config.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    ...(providerKey === 'openrouter' && {
                        'HTTP-Referer': 'https://job-scrabber.app',
                        'X-Title': 'Job Scrabber',
                    }),
                },
                body: JSON.stringify({
                    model: config.models[0],
                    messages: [{ role: 'user', content: TEST_PROMPT }],
                    max_tokens: 10,
                }),
            });
        }

        const latencyMs = Date.now() - start;

        if (response.ok) {
            return { status: 'ok', latencyMs };
        }

        if (response.status === 429) {
            const retryAfter = response.headers.get('retry-after');
            const waitMin = retryAfter ? Math.ceil(parseInt(retryAfter) / 60) : null;
            return {
                status: 'rate_limited',
                message: waitMin ? `Try again in ~${waitMin} min` : 'Rate limited',
                latencyMs,
            };
        }

        const errorData = await response.json().catch(() => ({}));
        const msg = errorData.error?.message || response.statusText;

        if (response.status === 401 || response.status === 403 || msg?.toLowerCase().includes('api key')) {
            return { status: 'invalid_key', message: 'Invalid API key', latencyMs };
        }

        return { status: 'error', message: `HTTP ${response.status}: ${msg}`, latencyMs };

    } catch (err) {
        return { status: 'error', message: err.message, latencyMs: Date.now() - start };
    }
}

export async function POST(request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { provider: targetProvider } = await request.json();

        const result = await query(
            'SELECT ai_providers, groq_api_key FROM user_profiles WHERE user_id = $1',
            [session.user.id]
        );

        let aiProviders = result.rows[0]?.ai_providers || {};
        const legacyKey = result.rows[0]?.groq_api_key;

        // Backward compat
        if (legacyKey && !aiProviders.groq) {
            aiProviders = { ...aiProviders, groq: { enabled: true, priority: 1, keys: [legacyKey] } };
        }

        const results = {};

        const providersToTest = targetProvider
            ? { [targetProvider]: aiProviders[targetProvider] }
            : aiProviders;

        for (const [providerKey, cfg] of Object.entries(providersToTest)) {
            if (!cfg || !PROVIDER_CONFIGS[providerKey]) continue;
            const keys = (cfg.keys || []).filter(Boolean);
            if (keys.length === 0) {
                results[providerKey] = [{ status: 'no_key', message: 'No keys configured' }];
                continue;
            }

            results[providerKey] = [];
            for (let i = 0; i < keys.length; i++) {
                const testResult = await testProvider(providerKey, keys[i]);
                results[providerKey].push({ keyIndex: i, ...testResult });
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (error) {
        console.error('AI test error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
