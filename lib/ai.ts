import { callAI } from '@/lib/ai/router';

export async function callGroqAPI(
  prompt: string,
  temperature = 0.2,
  userId: string | null = null
): Promise<string> {
  return callAI(prompt, temperature, userId);
}

export { parseAIResponse } from '@/lib/ai/parser';
export { callAI, getAIUsageStats } from '@/lib/ai/router';
