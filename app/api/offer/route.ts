import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';
import { CreateOfferSchema, UpdateOfferDecisionSchema, validateBody } from '@/lib/validations';
import logger from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const rawBody = await req.json();
    const validation = validateBody(CreateOfferSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error }, { status: validation.status });
    }

    const { applicationId, baseSalary, currency, bonus, equity, benefits, otherPerks, startDate, offerDeadline, userPriority } = validation.data;

    const result = await query(
      `INSERT INTO offer_details (user_id, application_id, base_salary, currency, bonus, equity, benefits, other_perks, start_date, offer_deadline, user_priority)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (application_id) DO UPDATE SET
         base_salary = EXCLUDED.base_salary, currency = EXCLUDED.currency,
         bonus = EXCLUDED.bonus, equity = EXCLUDED.equity,
         benefits = EXCLUDED.benefits, other_perks = EXCLUDED.other_perks,
         start_date = EXCLUDED.start_date, offer_deadline = EXCLUDED.offer_deadline,
         user_priority = EXCLUDED.user_priority, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, applicationId, baseSalary ?? null, currency ?? 'USD', bonus ?? null, equity ?? null,
       JSON.stringify(benefits ?? []), otherPerks ?? null, startDate ?? null, offerDeadline ?? null, userPriority ?? null]
    );

    return NextResponse.json({ success: true, offer: result.rows[0] });
  } catch (error) {
    logger.error('Offer save failed', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ success: false, error: 'Failed to save offer' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get('applicationId');
    if (!applicationId) {
      return NextResponse.json({ success: false, error: 'applicationId required' }, { status: 400 });
    }

    const rawBody = await req.json();
    const validation = validateBody(UpdateOfferDecisionSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error }, { status: validation.status });
    }

    const { decision, counterOfferSent } = validation.data;

    const result = await query(
      `UPDATE offer_details SET
        decision = $1,
        counter_offer_sent = COALESCE($2, counter_offer_sent),
        updated_at = CURRENT_TIMESTAMP
       WHERE application_id = $3 AND user_id = $4
       RETURNING *`,
      [decision, counterOfferSent ?? null, parseInt(applicationId), userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Offer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, offer: result.rows[0] });
  } catch (error) {
    logger.error('Offer decision update failed', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ success: false, error: 'Failed to update offer decision' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get('applicationId');
    if (!applicationId) {
      return NextResponse.json({ success: false, error: 'applicationId required' }, { status: 400 });
    }

    const result = await query(
      'SELECT * FROM offer_details WHERE application_id = $1 AND user_id = $2',
      [parseInt(applicationId), userId]
    );

    return NextResponse.json({ success: true, offer: result.rows[0] ?? null });
  } catch (error) {
    logger.error('Offer fetch failed', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ success: false, error: 'Failed to fetch offer' }, { status: 500 });
  }
}
