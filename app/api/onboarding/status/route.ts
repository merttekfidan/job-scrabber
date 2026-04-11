import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query(
      `SELECT cv_extracted, onboarding_completed, onboarding_qa
       FROM user_profiles WHERE user_id = $1`,
      [session.user.id]
    );

    const profile = result.rows[0];

    return NextResponse.json({
      success: true,
      hasCv: !!profile?.cv_extracted && Object.keys(profile.cv_extracted as object).length > 0,
      onboardingCompleted: !!profile?.onboarding_completed,
      cvExtracted: profile?.cv_extracted || null,
      onboardingQa: profile?.onboarding_qa || null,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to check onboarding status' }, { status: 500 });
  }
}
