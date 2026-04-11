import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';
import { callGroqAPI, parseAIResponse } from '@/lib/ai';
import { SKILL_GAP_ANALYSIS_PROMPT } from '@/lib/ai/prompts';
import { aiLimiter, getRateLimitKey } from '@/lib/rate-limit';
import logger from '@/lib/logger';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const rlKey = getRateLimitKey(req, `ai:${userId}`);
    const rlResult = aiLimiter(rlKey);
    if (!rlResult.success) {
      return NextResponse.json({ success: false, error: `Rate limited. Try again in ${rlResult.reset}s.` }, { status: 429 });
    }

    // Aggregate required skills from all active applications
    const appsResult = await query(
      `SELECT required_skills, job_title FROM applications
       WHERE user_id = $1 AND status NOT IN ('Rejected', 'Withdrawn') ORDER BY created_at DESC LIMIT 30`,
      [userId]
    );

    const skillFrequency: Record<string, number> = {};
    const targetRoles: Set<string> = new Set();

    for (const row of appsResult.rows as { required_skills: unknown; job_title: string }[]) {
      if (row.job_title) targetRoles.add(row.job_title);
      let skills: string[] = [];
      try {
        skills = typeof row.required_skills === 'string'
          ? JSON.parse(row.required_skills)
          : Array.isArray(row.required_skills) ? row.required_skills as string[] : [];
      } catch { skills = []; }
      skills.forEach((s) => {
        const key = s.toLowerCase().trim();
        skillFrequency[key] = (skillFrequency[key] ?? 0) + 1;
      });
    }

    if (Object.keys(skillFrequency).length === 0) {
      return NextResponse.json({ success: false, error: 'No active applications with skills found' }, { status: 400 });
    }

    const cvResult = await query(
      'SELECT raw_text, skills_extracted FROM cv_data WHERE is_active = TRUE AND user_id = $1 ORDER BY uploaded_at DESC LIMIT 1',
      [userId]
    );
    if (cvResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Please upload a CV first' }, { status: 400 });
    }
    const cv = cvResult.rows[0] as { raw_text: string; skills_extracted: unknown };

    let cvSkills: string[] = [];
    try {
      cvSkills = typeof cv.skills_extracted === 'string'
        ? JSON.parse(cv.skills_extracted)
        : Array.isArray(cv.skills_extracted) ? cv.skills_extracted as string[] : [];
    } catch { cvSkills = []; }

    const aggregatedSkills = Object.entries(skillFrequency)
      .sort((a, b) => b[1] - a[1])
      .map(([skill, count]) => `${skill} (${count} applications)`)
      .join(', ');

    const prompt = SKILL_GAP_ANALYSIS_PROMPT(
      cvSkills.length > 0 ? cvSkills : [cv.raw_text.substring(0, 2000)],
      aggregatedSkills,
      'Mid-level to Senior',
      Array.from(targetRoles).slice(0, 5).join(', ')
    );

    const aiResponse = await callGroqAPI(prompt, 0.3, userId);
    const analysis = parseAIResponse(aiResponse) as Record<string, unknown>;

    return NextResponse.json({
      success: true,
      analysis,
      meta: {
        totalApplications: appsResult.rows.length,
        uniqueSkillsRequired: Object.keys(skillFrequency).length,
      },
    });
  } catch (error) {
    logger.error('Skill gap analysis failed', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ success: false, error: 'Failed to analyze skill gaps' }, { status: 500 });
  }
}
