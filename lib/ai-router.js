import logger from './logger.js';
import { query } from '@/lib/db';

// ─── Provider Definitions ──────────────────────────────────────────────────

export const PROVIDER_CONFIGS = {
    groq: {
        name: 'Groq',
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        type: 'openai-compat',
        models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
        freeLimit: '1,000 req/day',
        keyPrefix: 'gsk_',
        docsUrl: 'https://console.groq.com/keys',
    },
    gemini: {
        name: 'Google Gemini',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
        type: 'gemini',
        models: ['gemini-2.0-flash', 'gemini-1.5-flash'],
        freeLimit: '1,500 req/day',
        keyPrefix: 'AIza',
        docsUrl: 'https://aistudio.google.com/app/apikey',
    },
    openrouter: {
        name: 'OpenRouter',
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        type: 'openai-compat',
        models: ['meta-llama/llama-3.3-70b-instruct:free', 'qwen/qwen-2.5-72b-instruct:free'],
        freeLimit: 'Free models available',
        keyPrefix: 'sk-or-',
        docsUrl: 'https://openrouter.ai/keys',
    },
    claude: {
        name: 'Anthropic Claude',
        endpoint: 'https://api.anthropic.com/v1/messages',
        type: 'claude',
        models: ['claude-sonnet-4-6', 'claude-3-7-sonnet-20250219', 'claude-3-5-sonnet-20241022'],
        freeLimit: 'Pay-as-you-go',
        keyPrefix: 'sk-ant-',
        docsUrl: 'https://console.anthropic.com/settings/keys',
    },
};

// ─── Default provider priority order ──────────────────────────────────────

const DEFAULT_PRIORITY = ['groq', 'claude', 'gemini', 'openrouter'];

// ─── Call a single provider with a single key ─────────────────────────────

async function callProvider(providerKey, apiKey, prompt, temperature = 0.2) {
    const config = PROVIDER_CONFIGS[providerKey];
    if (!config) throw new Error(`Unknown provider: ${providerKey}`);

    if (config.type === 'gemini') {
        return callGemini(config, apiKey, prompt, temperature);
    }
    if (config.type === 'claude') {
        return callClaude(config, apiKey, prompt, temperature);
    }
    return callOpenAICompat(config, apiKey, prompt, temperature);
}

async function callOpenAICompat(config, apiKey, prompt, temperature) {
    // Try models in order for this provider (first model primary, rest fallback)
    for (const model of config.models) {
        const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                ...(config.name === 'OpenRouter' && {
                    'HTTP-Referer': 'https://huntiq.work',
                    'X-Title': 'HuntIQ',
                }),
            },
            body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: prompt }],
                temperature,
                max_tokens: 2048,
                top_p: 0.95,
            }),
        });

        if (response.ok) {
            const data = await response.json();
            logger.info('AI call succeeded', { provider: config.name, model });
            return data.choices[0].message.content;
        }

        if (response.status === 429) {
            logger.warn('Model rate limited, trying next model', { provider: config.name, model });
            // Try next model in the list
            continue;
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(`${config.name} API error (${response.status}): ${errorData.error?.message || response.statusText}`);
    }

    // All models for this provider rate limited
    throw { isRateLimited: true, provider: config.name };
}

async function callGemini(config, apiKey, prompt, temperature) {
    for (const model of config.models) {
        const endpoint = config.endpoint.replace('{model}', model);
        const url = `${endpoint}?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature,
                    maxOutputTokens: 2048,
                    topP: 0.95,
                },
            }),
        });

        if (response.ok) {
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) throw new Error('Gemini returned an empty response');
            logger.info('AI call succeeded', { provider: 'Gemini', model });
            return text;
        }

        if (response.status === 429) {
            logger.warn('Gemini model rate limited, trying next model', { model });
            continue;
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API error (${response.status}): ${errorData.error?.message || response.statusText}`);
    }

    throw { isRateLimited: true, provider: 'Gemini' };
}

async function callClaude(config, apiKey, prompt, temperature) {
    let lastClaudeError = 'Rate limited';
    for (const model of config.models) {
        const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: prompt }],
                temperature,
                max_tokens: 2048,
            }),
        });

        if (response.ok) {
            const data = await response.json();
            logger.info('AI call succeeded', { provider: config.name, model });
            return data.content[0].text;
        }

        let errorData = {};
        const rawText = await response.text().catch(() => '');
        try {
            errorData = JSON.parse(rawText);
        } catch (e) {
            // Not JSON
        }

        const errType = errorData?.error?.type;
        const msg = errorData?.error?.message || rawText || response.statusText || 'Unknown Anthropic Error';

        // 429 = Rate Limit, 404 = Endpoint/Model Not Found, 400 = Bad Request (often Model Not Found or Invalid Tier)
        if (response.status === 429 || response.status === 404 || response.status === 400 || (msg || '').toLowerCase().includes('model')) {
            lastClaudeError = `${model} (${response.status}): ${msg}`;
            logger.warn('Claude model rate limited or unavailable, trying next model', { model, status: response.status, msg });
            continue;
        }

        throw new Error(`Claude API error (${response.status}): ${msg}`);
    }

    throw { isRateLimited: true, provider: 'Claude', message: lastClaudeError };
}

// ─── Main Pool Router ──────────────────────────────────────────────────────

/**
 * Calls the AI using the user's configured provider pool.
 * Iterates providers/keys in priority order. Falls back on 429.
 */
export async function callAIWithPool(prompt, temperature = 0.2, userId = null) {
    let providersConfig = {};
    let usingSystemKey = false;

    // Load user's provider config from DB
    if (userId) {
        try {
            const result = await query(
                'SELECT ai_providers, groq_api_key, settings FROM user_profiles WHERE user_id = $1',
                [userId]
            );
            if (result.rows.length > 0) {
                providersConfig = result.rows[0].ai_providers || {};

                // Backward compat: if ai_providers is empty but groq_api_key exists, synthesize it
                const legacyKey = result.rows[0].groq_api_key;
                if (legacyKey && !providersConfig.groq) {
                    providersConfig.groq = { enabled: true, priority: 1, keys: [legacyKey] };
                }
            }
        } catch (e) {
            logger.warn('Failed to fetch AI providers from DB', { error: e.message });
        }
    }

    // Build ordered list of (providerKey, apiKey) pairs to try
    let candidates = buildCandidateList(providersConfig);

    // ─── System Key Fallback (Beta Mode) ───────────────────────
    if (candidates.length === 0) {
        const systemCandidates = [];

        if (process.env.SYSTEM_GROQ_KEY) {
            systemCandidates.push({ providerKey: 'groq', apiKey: process.env.SYSTEM_GROQ_KEY });
        }
        if (process.env.SYSTEM_CLAUDE_KEY) {
            systemCandidates.push({ providerKey: 'claude', apiKey: process.env.SYSTEM_CLAUDE_KEY });
        }
        if (process.env.SYSTEM_GEMINI_KEY) {
            systemCandidates.push({ providerKey: 'gemini', apiKey: process.env.SYSTEM_GEMINI_KEY });
        }

        if (systemCandidates.length === 0) {
            throw new Error('No AI providers configured. Please add at least one API key in Settings.');
        }

        // Check monthly usage limit for system keys
        if (userId) {
            const usageCheck = await checkSystemKeyUsage(userId);
            if (!usageCheck.allowed) {
                throw new Error(
                    `Monthly AI limit reached (${usageCheck.used}/${usageCheck.limit}). ` +
                    `Resets on ${usageCheck.resetDate}. Add your own API key in Settings for unlimited usage.`
                );
            }
        }

        candidates = systemCandidates;
        usingSystemKey = true;
        logger.info('Using system API key (beta mode)', { userId });
    }

    const rateLimitedProviders = new Set();

    let lastError = null;

    for (const { providerKey, apiKey } of candidates) {
        if (rateLimitedProviders.has(providerKey)) continue;

        try {
            const result = await callProvider(providerKey, apiKey, prompt, temperature);

            // Track usage for system keys
            if (usingSystemKey && userId) {
                await incrementSystemKeyUsage(userId);
            }

            return result;
        } catch (err) {
            if (err.isRateLimited) {
                logger.warn('Provider rate limited, trying next', { provider: err.provider, msg: err.message });
                rateLimitedProviders.add(providerKey);
                lastError = err.message || lastError;
                continue;
            }
            // Non-rate-limit error (bad key, server error, etc.) — log and try next key
            logger.error('Provider key failed deeply:', {
                provider: providerKey,
                error: err.message,
                stack: err.stack,
            });
            lastError = err.message;
        }
    }

    throw new Error(
        lastError ? `Provider failed: ${lastError}` : 'All configured AI providers are currently rate limited or unavailable. Please wait a few minutes and try again, or add more API keys in Settings.'
    );
}

// ─── System Key Usage Tracking (PostgreSQL-based) ─────────────────────────

const MONTHLY_SYSTEM_KEY_LIMIT = 50;

async function checkSystemKeyUsage(userId) {
    try {
        const result = await query(
            'SELECT settings FROM user_profiles WHERE user_id = $1',
            [userId]
        );

        const settings = result.rows[0]?.settings || {};
        const usage = settings.ai_usage || {};
        const now = new Date();
        const resetDate = usage.reset_date ? new Date(usage.reset_date) : null;

        // Reset if we're in a new month
        if (!resetDate || now >= resetDate) {
            return { allowed: true, used: 0, limit: MONTHLY_SYSTEM_KEY_LIMIT, resetDate: getNextResetDate() };
        }

        const used = usage.count || 0;
        return {
            allowed: used < MONTHLY_SYSTEM_KEY_LIMIT,
            used,
            limit: MONTHLY_SYSTEM_KEY_LIMIT,
            resetDate: resetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        };
    } catch (e) {
        logger.warn('Usage check failed, allowing request', { error: e.message });
        return { allowed: true, used: 0, limit: MONTHLY_SYSTEM_KEY_LIMIT };
    }
}

async function incrementSystemKeyUsage(userId) {
    try {
        const result = await query(
            'SELECT settings FROM user_profiles WHERE user_id = $1',
            [userId]
        );

        const settings = result.rows[0]?.settings || {};
        const usage = settings.ai_usage || {};
        const now = new Date();
        const resetDate = usage.reset_date ? new Date(usage.reset_date) : null;

        // Reset if we're in a new month
        if (!resetDate || now >= resetDate) {
            settings.ai_usage = { count: 1, reset_date: getNextResetDate() };
        } else {
            settings.ai_usage = { count: (usage.count || 0) + 1, reset_date: usage.reset_date };
        }

        await query(
            'UPDATE user_profiles SET settings = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
            [JSON.stringify(settings), userId]
        );
    } catch (e) {
        logger.warn('Failed to increment usage counter', { error: e.message });
    }
}

function getNextResetDate() {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return next.toISOString();
}

// ─── Public: Get usage stats for frontend ─────────────────────────────────

export async function getAIUsageStats(userId) {
    const check = await checkSystemKeyUsage(userId);
    // Also check if user has their own keys
    const result = await query(
        'SELECT ai_providers, groq_api_key FROM user_profiles WHERE user_id = $1',
        [userId]
    );
    const hasOwnKeys = result.rows.length > 0 && (
        buildCandidateList(result.rows[0].ai_providers || {}).length > 0 ||
        !!result.rows[0].groq_api_key
    );

    return {
        ...check,
        hasOwnKeys,
        usingSystemKeys: !hasOwnKeys,
    };
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function buildCandidateList(providersConfig) {
    const candidates = [];

    // Sort providers by priority (lower number = higher priority)
    const sortedProviders = DEFAULT_PRIORITY.slice().sort((a, b) => {
        const pa = providersConfig[a]?.priority ?? 99;
        const pb = providersConfig[b]?.priority ?? 99;
        return pa - pb;
    });

    for (const providerKey of sortedProviders) {
        const cfg = providersConfig[providerKey];
        if (!cfg || cfg.enabled === false) continue;
        const keys = (cfg.keys || []).filter(Boolean);
        for (const key of keys) {
            candidates.push({ providerKey, apiKey: key });
        }
    }

    return candidates;
}

/**
 * Sanitize providers for client — returns key COUNT only, never the key values.
 * This prevents masked strings from leaking into frontend state and being saved back.
 */
export function maskProviders(providersConfig) {
    const sanitized = {};
    for (const [providerKey, cfg] of Object.entries(providersConfig || {})) {
        sanitized[providerKey] = {
            enabled: cfg.enabled,
            priority: cfg.priority,
            keyCount: (cfg.keys || []).filter(Boolean).length,
            // keys intentionally omitted — never send to client
        };
    }
    return sanitized;
}
