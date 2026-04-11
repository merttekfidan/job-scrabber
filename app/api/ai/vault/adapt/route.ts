import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';
import { callGroqAPI, parseAIResponse } from '@/lib/ai';
import { VAULT_ADAPT_ANSWER_PROMPT } from '@/lib/ai/prompts';
import { VaultAdaptSchema, validateBody } from '@/lib/validations';
import { aiLimiter, getRateLimitKey } from '@/lib/rate-limit';
import logger from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const rlKey = getRateLimitKey(req, `ai:${userId}`);
    const rlResult = aiLimiter(rlKey);
    if (!rlResult.success) {
      return NextResponse.json(
        { success: false, error: `AI rate limited. Try again in ${rlResult.reset}s.` },
        { status: 429 }
      );
    }

    const rawBody = await req.json();
    const validation = validateBody(VaultAdaptSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: validation.status }
      );
    }

    const { vaultId, applicationId } = validation.data;

    const vaultResult = await query(
      'SELECT * FROM interview_vault WHERE id = $1 AND user_id = $2',
      [vaultId, userId]
    );
    if (vaultResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Vault answer not found' }, { status: 404 });
    }
    const vaultAnswer = vaultResult.rows[0] as Record<string, unknown>;

    const appResult = await query(
      'SELECT * FROM applications WHERE id = $1 AND user_id = $2',
      [applicationId, userId]
    );
    if (appResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }
    const application = appResult.rows[0] as Record<string, unknown>;

    const jobDescription =
      (application.formatted_content as string) ||
      (application.original_content as string) ||
      (application.company_description as string) ||
      '';

    let requiredSkills: string[] = [];
    try {
      const raw = application.required_skills;
      requiredSkills = typeof raw === 'string' ? JSON.parse(raw) : (raw as string[]) || [];
    } catch {
      requiredSkills = [];
    }

    let companyInfo = '';
    try {
      const raw = application.company_info;
      companyInfo = typeof raw === 'string' ? raw : JSON.stringify(raw || {});
    } catch {
      companyInfo = '';
    }

    const prompt = VAULT_ADAPT_ANSWER_PROMPT(
      vaultAnswer.full_answer as string,
      vaultAnswer.question as string,
      jobDescription.substring(0, 10000),
      requiredSkills,
      companyInfo.substring(0, 3000)
    );

    const aiResponse = await callGroqAPI(prompt, 0.3, userId);
    const parsed = parseAIResponse(aiResponse) as Record<string, unknown>;

    return NextResponse.json({ success: true, adapted: parsed });
  } catch (error) {
    logger.error('Vault adapt failed', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to adapt answer' },
      { status: 500 }
    );
  }
}
