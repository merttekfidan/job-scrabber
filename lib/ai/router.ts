import logger from '@/lib/logger';
import { query } from '@/lib/db';

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
const DAILY_LIMIT = 20;

async function callGroq(
  apiKey: string,
  prompt: string,
  temperature: number,
  model: string
): Promise<string | null> {
  const response = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: 8192,
      top_p: 0.95,
    }),
  });

  if (response.ok) {
    const data = (await response.json()) as { choices: Array<{ message: { content: string } }> };
    return data.choices[0].message.content;
  }

  if (response.status === 429) {
    return null;
  }

  const errorData = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
  throw new Error(`Groq API error (${response.status}): ${errorData.error?.message || response.statusText}`);
}

function getTodayResetDate(): string {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return tomorrow.toISOString();
}

interface UsageResult {
  allowed: boolean;
  used: number;
  limit: number;
  resetsAt?: string;
}

async function checkDailyUsage(userId: string): Promise<UsageResult> {
  try {
    const result = await query('SELECT settings FROM user_profiles WHERE user_id = $1', [userId]);
    const settings = (result.rows[0]?.settings as Record<string, unknown>) || {};
    const usage = (settings.ai_usage as { count?: number; reset_date?: string }) || {};
    const now = new Date();
    const resetDate = usage.reset_date ? new Date(usage.reset_date) : null;

    if (!resetDate || now >= resetDate) {
      return { allowed: true, used: 0, limit: DAILY_LIMIT, resetsAt: getTodayResetDate() };
    }

    const used = usage.count || 0;
    return {
      allowed: used < DAILY_LIMIT,
      used,
      limit: DAILY_LIMIT,
      resetsAt: usage.reset_date,
    };
  } catch (e) {
    logger.warn('Usage check failed, allowing request', { error: e instanceof Error ? e.message : String(e) });
    return { allowed: true, used: 0, limit: DAILY_LIMIT };
  }
}

async function incrementDailyUsage(userId: string): Promise<void> {
  try {
    const result = await query('SELECT settings FROM user_profiles WHERE user_id = $1', [userId]);
    const settings = (result.rows[0]?.settings as Record<string, unknown>) || {};
    const usage = (settings.ai_usage as { count?: number; reset_date?: string }) || {};
    const now = new Date();
    const resetDate = usage.reset_date ? new Date(usage.reset_date) : null;

    if (!resetDate || now >= resetDate) {
      (settings as Record<string, unknown>).ai_usage = { count: 1, reset_date: getTodayResetDate() };
    } else {
      (settings as Record<string, unknown>).ai_usage = {
        count: (usage.count || 0) + 1,
        reset_date: usage.reset_date,
      };
    }

    await query(
      'UPDATE user_profiles SET settings = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      [JSON.stringify(settings), userId]
    );
  } catch (e) {
    logger.warn('Failed to increment usage counter', { error: e instanceof Error ? e.message : String(e) });
  }
}

export async function callAI(
  prompt: string,
  temperature = 0.2,
  userId: string | null = null
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('AI service is not configured. Please contact support.');
  }

  if (userId) {
    const usage = await checkDailyUsage(userId);
    if (!usage.allowed) {
      throw new Error(`Daily AI limit reached (${usage.used}/${usage.limit}). Please try again tomorrow.`);
    }
  }

  for (const model of GROQ_MODELS) {
    logger.info('Calling Groq AI', { model });
    const result = await callGroq(apiKey, prompt, temperature, model);

    if (result !== null) {
      if (userId) {
        await incrementDailyUsage(userId);
      }
      logger.info('AI call succeeded', { model });
      return result;
    }
    logger.warn('Model rate limited, trying fallback', { model });
  }

  throw new Error('AI service is temporarily unavailable. Please try again in a few minutes.');
}

export async function getAIUsageStats(userId: string): Promise<{ used: number; limit: number; resetsAt?: string }> {
  const usage = await checkDailyUsage(userId);
  return {
    used: usage.used,
    limit: usage.limit,
    resetsAt: usage.resetsAt,
  };
}
