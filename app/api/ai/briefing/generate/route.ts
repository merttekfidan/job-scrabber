import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';
import { callGroqAPI, parseAIResponse } from '@/lib/ai';
import { BRIEFING_GENERATE_PROMPT } from '@/lib/ai/prompts';
import { BriefingGenerateSchema, validateBody } from '@/lib/validations';
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
    const validation = validateBody(BriefingGenerateSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: validation.status }
      );
    }

    const { applicationId, roundType, roundIndex } = validation.data;

    // Fetch application data
    const appResult = await query(
      `SELECT job_title, company, salary, role_summary, formatted_content, original_content,
              company_description, company_info, interview_prep_key_talking_points,
              interview_prep_questions_to_ask, interview_prep_potential_red_flags,
              interview_prep_notes, required_skills, interview_stages
       FROM applications WHERE id = $1 AND user_id = $2`,
      [applicationId, userId]
    );
    if (appResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }
    const app = appResult.rows[0] as Record<string, unknown>;

    // Fetch vault answers (top 10 most relevant)
    const vaultResult = await query(
      `SELECT question, full_answer, category, key_phrases FROM interview_vault
       WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 10`,
      [userId]
    );

    // Fetch study package for this round (if roundIndex provided)
    let studyNotes = 'No study package generated yet.';
    if (roundIndex !== undefined) {
      const studyResult = await query(
        `SELECT questions, must_know_facts, quick_wins, focus_summary
         FROM study_packages WHERE application_id = $1 AND round_index = $2 AND user_id = $3`,
        [applicationId, roundIndex, userId]
      );
      if (studyResult.rows.length > 0) {
        const sp = studyResult.rows[0] as Record<string, unknown>;
        studyNotes = JSON.stringify({
          focusSummary: sp.focus_summary,
          mustKnowFacts: sp.must_know_facts,
          quickWins: sp.quick_wins,
          questionCount: Array.isArray(sp.questions) ? (sp.questions as unknown[]).length : 0,
        });
      }
    }

    // Fetch previous debriefs for this application
    const debriefResult = await query(
      `SELECT round_type, overall_feeling, questions, ai_analysis, interview_date
       FROM interview_debriefs WHERE application_id = $1 AND user_id = $2
       ORDER BY created_at DESC LIMIT 3`,
      [applicationId, userId]
    );

    const applicationStr = JSON.stringify({
      jobTitle: app.job_title,
      company: app.company,
      salary: app.salary,
      roleSummary: app.role_summary,
      requiredSkills: app.required_skills,
      talkingPoints: app.interview_prep_key_talking_points,
      questionsToAsk: app.interview_prep_questions_to_ask,
      redFlags: app.interview_prep_potential_red_flags,
      prepNotes: app.interview_prep_notes,
      jobDescription: (app.formatted_content as string)?.substring(0, 3000) ||
                      (app.original_content as string)?.substring(0, 3000),
    });

    const companyInsightsStr = JSON.stringify(app.company_info || {});
    const vaultStr = vaultResult.rows.length > 0
      ? JSON.stringify(vaultResult.rows)
      : 'No vault answers saved yet.';
    const debriefStr = debriefResult.rows.length > 0
      ? JSON.stringify(debriefResult.rows)
      : undefined;

    const prompt = BRIEFING_GENERATE_PROMPT(
      applicationStr.substring(0, 8000),
      roundType,
      companyInsightsStr.substring(0, 2000),
      vaultStr.substring(0, 3000),
      studyNotes.substring(0, 2000),
      debriefStr?.substring(0, 2000)
    );

    const aiResponse = await callGroqAPI(prompt, 0.3, userId);
    const parsed = parseAIResponse(aiResponse) as Record<string, unknown>;

    if (!parsed.briefing) {
      return NextResponse.json({ success: false, error: 'AI did not return a briefing. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, briefing: parsed.briefing });
  } catch (error) {
    logger.error('Briefing generate failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to generate briefing' },
      { status: 500 }
    );
  }
}
