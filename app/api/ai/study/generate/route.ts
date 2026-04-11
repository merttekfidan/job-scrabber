import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';
import { callGroqAPI, parseAIResponse } from '@/lib/ai';
import { STUDY_GENERATE_PACKAGE_PROMPT } from '@/lib/ai/prompts';
import { StudyGenerateSchema, validateBody } from '@/lib/validations';
import { aiLimiter, getRateLimitKey } from '@/lib/rate-limit';
import logger from '@/lib/logger';

type RawApplication = {
  formatted_content: string | null;
  original_content: string | null;
  company_description: string | null;
  company_info: unknown;
  required_skills: unknown;
};

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
    const validation = validateBody(StudyGenerateSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: validation.status }
      );
    }

    const { applicationId, roundIndex, roundType } = validation.data;

    const appResult = await query(
      'SELECT formatted_content, original_content, company_description, company_info, required_skills FROM applications WHERE id = $1 AND user_id = $2',
      [applicationId, userId]
    );
    if (appResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }
    const app = appResult.rows[0] as RawApplication;

    const jobDescription =
      app.formatted_content ||
      app.original_content ||
      app.company_description ||
      '';

    let requiredSkills: string[] = [];
    try {
      const raw = app.required_skills;
      if (typeof raw === 'string') {
        requiredSkills = JSON.parse(raw) as string[];
      } else if (Array.isArray(raw)) {
        requiredSkills = raw as string[];
      } else {
        requiredSkills = [];
      }
    } catch {
      requiredSkills = [];
    }

    let companyInfo = '';
    try {
      companyInfo =
        typeof app.company_info === 'string'
          ? app.company_info
          : JSON.stringify(app.company_info ?? {});
    } catch {
      companyInfo = '';
    }

    const cvResult = await query(
      'SELECT raw_text, id FROM cv_data WHERE is_active = TRUE AND user_id = $1 ORDER BY uploaded_at DESC LIMIT 1',
      [userId]
    );
    const cvRow = cvResult.rows[0] as { raw_text: string; id: number } | undefined;
    if (!cvRow?.raw_text) {
      return NextResponse.json(
        { success: false, error: 'Please upload a CV first to generate study notes.' },
        { status: 400 }
      );
    }

    const prompt = STUDY_GENERATE_PACKAGE_PROMPT(
      jobDescription.substring(0, 10000),
      requiredSkills,
      roundType,
      companyInfo.substring(0, 5000),
      cvRow.raw_text.substring(0, 5000)
    );

    const aiResponse = await callGroqAPI(prompt, 0.3, userId);
    const parsed = parseAIResponse(aiResponse) as {
      studyPackage?: {
        roundType?: string;
        focusSummary?: string;
        timeAllocation?: Record<string, number>;
        questions?: unknown[];
        mustKnowFacts?: unknown[];
        quickWins?: string[];
        dangerZones?: unknown[];
      };
    };

    if (!parsed.studyPackage) {
      return NextResponse.json(
        { success: false, error: 'AI did not return a study package' },
        { status: 500 }
      );
    }

    const pkg = parsed.studyPackage;

    const existing = await query(
      'SELECT id, regenerated_count, user_notes, questions_prepared, debrief_influenced FROM study_packages WHERE application_id = $1 AND round_index = $2 AND user_id = $3',
      [applicationId, roundIndex, userId]
    );

    const existingRow = existing.rows[0] as
      | {
          id: number;
          regenerated_count: number;
          user_notes: Record<string, string> | null;
          questions_prepared: string[] | null;
          debrief_influenced: boolean | null;
        }
      | undefined;

    const userNotes = existingRow?.user_notes ?? {};
    const questionsPrepared = existingRow?.questions_prepared ?? [];
    const regeneratedCount = existingRow ? existingRow.regenerated_count + 1 : 0;
    const debriefInfluenced = existingRow?.debrief_influenced ?? false;

    const upsertSql = `
      INSERT INTO study_packages (
        user_id,
        application_id,
        round_index,
        round_type,
        focus_summary,
        time_allocation,
        questions,
        must_know_facts,
        quick_wins,
        danger_zones,
        user_notes,
        questions_prepared,
        generated_at,
        regenerated_count,
        debrief_influenced
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,CURRENT_TIMESTAMP,$13,$14
      )
      ON CONFLICT (application_id, round_index)
      DO UPDATE SET
        round_type = EXCLUDED.round_type,
        focus_summary = EXCLUDED.focus_summary,
        time_allocation = EXCLUDED.time_allocation,
        questions = EXCLUDED.questions,
        must_know_facts = EXCLUDED.must_know_facts,
        quick_wins = EXCLUDED.quick_wins,
        danger_zones = EXCLUDED.danger_zones,
        generated_at = CURRENT_TIMESTAMP,
        regenerated_count = EXCLUDED.regenerated_count,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`;

    const result = await query(upsertSql, [
      userId,
      applicationId,
      roundIndex,
      roundType,
      pkg.focusSummary ?? null,
      JSON.stringify(pkg.timeAllocation ?? {}),
      JSON.stringify(pkg.questions ?? []),
      JSON.stringify(pkg.mustKnowFacts ?? []),
      JSON.stringify(pkg.quickWins ?? []),
      JSON.stringify(pkg.dangerZones ?? []),
      JSON.stringify(userNotes),
      JSON.stringify(questionsPrepared),
      regeneratedCount,
      debriefInfluenced,
    ]);

    return NextResponse.json({
      success: true,
      package: result.rows[0],
      sourceCvId: cvRow.id,
    });
  } catch (error) {
    logger.error('Study package generate failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: 'Failed to generate study package' },
      { status: 500 }
    );
  }
}

