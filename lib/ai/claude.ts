import Anthropic from '@anthropic-ai/sdk';
import logger from '@/lib/logger';
import { query } from '@/lib/db';

const DAILY_LIMIT = 20;

let client: Anthropic | null = null;

const getClient = (): Anthropic => {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('AI service is not configured. Set ANTHROPIC_API_KEY.');
    }
    client = new Anthropic({ apiKey });
  }
  return client;
};

type ClaudeModel = 'claude-sonnet-4-20250514' | 'claude-haiku-4-20250414';

interface CallClaudeOptions {
  model?: ClaudeModel;
  temperature?: number;
  maxTokens?: number;
  userId?: string | null;
  systemPrompt?: string;
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

const checkDailyUsage = async (userId: string): Promise<UsageResult> => {
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
    return { allowed: used < DAILY_LIMIT, used, limit: DAILY_LIMIT, resetsAt: usage.reset_date };
  } catch (e) {
    logger.warn('Usage check failed, allowing request', { error: e instanceof Error ? e.message : String(e) });
    return { allowed: true, used: 0, limit: DAILY_LIMIT };
  }
};

const incrementDailyUsage = async (userId: string): Promise<void> => {
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
};

export const callClaude = async (
  prompt: string,
  options: CallClaudeOptions = {}
): Promise<string> => {
  const {
    model = 'claude-sonnet-4-20250514',
    temperature = 0.2,
    maxTokens = 8192,
    userId = null,
    systemPrompt,
  } = options;

  if (userId) {
    const usage = await checkDailyUsage(userId);
    if (!usage.allowed) {
      throw new Error(`Daily AI limit reached (${usage.used}/${usage.limit}). Please try again tomorrow.`);
    }
  }

  const anthropic = getClient();

  logger.info('Calling Claude AI', { model });

  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    ...(systemPrompt ? { system: systemPrompt } : {}),
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude returned no text content.');
  }

  if (userId) {
    await incrementDailyUsage(userId);
  }

  logger.info('Claude call succeeded', { model, inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens });

  return textBlock.text;
};

export const callClaudeJSON = async <T = unknown>(
  prompt: string,
  options: CallClaudeOptions = {}
): Promise<T> => {
  const systemPrompt = (options.systemPrompt ?? '') +
    '\n\nYou MUST respond with valid JSON only. No markdown fences, no explanation, no extra text.';

  const raw = await callClaude(prompt, { ...options, systemPrompt: systemPrompt.trim() });

  let cleaned = raw.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  return JSON.parse(cleaned) as T;
};

export const getAIUsageStats = async (
  userId: string
): Promise<{ used: number; limit: number; resetsAt?: string }> => {
  const usage = await checkDailyUsage(userId);
  return { used: usage.used, limit: usage.limit, resetsAt: usage.resetsAt };
};
