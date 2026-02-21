import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/auth';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user.id;

        // Run all queries in parallel
        const [
            velocityResult,
            responseRateResult,
            avgTimeResult,
            skillDemandResult,
            weeklyDigestResult,
            streakResult
        ] = await Promise.all([
            // Application Velocity — apps per week over last 4 weeks
            query(`
                SELECT
                    TO_CHAR(date_trunc('week', application_date), 'YYYY-MM-DD') as week_start,
                    COUNT(*) as count
                FROM applications
                WHERE user_id = $1 AND application_date >= NOW() - INTERVAL '4 weeks'
                GROUP BY week_start
                ORDER BY week_start
            `, [userId]),

            // Response Rate — % that moved past "Applied"
            query(`
                SELECT
                    COUNT(*) FILTER (WHERE status != 'Applied') as responded,
                    COUNT(*) as total
                FROM applications
                WHERE user_id = $1
            `, [userId]),

            // Average Time-to-Response — days between application and status change
            query(`
                SELECT
                    AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400)::numeric(10,1) as avg_days
                FROM applications
                WHERE user_id = $1 AND status != 'Applied' AND updated_at IS NOT NULL AND created_at IS NOT NULL
            `, [userId]),

            // Skill Demand Heatmap — most requested skills across all applications
            query(`
                SELECT required_skills FROM applications WHERE user_id = $1 AND required_skills IS NOT NULL
            `, [userId]),

            // Weekly Digest — this week vs last week
            query(`
                SELECT
                    COUNT(*) FILTER (WHERE application_date >= date_trunc('week', CURRENT_DATE)) as this_week,
                    COUNT(*) FILTER (WHERE application_date >= date_trunc('week', CURRENT_DATE) - INTERVAL '7 days'
                                     AND application_date < date_trunc('week', CURRENT_DATE)) as last_week,
                    COUNT(*) FILTER (WHERE status LIKE '%Interview%' AND application_date >= NOW() - INTERVAL '7 days') as interviews_this_week,
                    COUNT(*) FILTER (WHERE status LIKE '%Offer%' AND application_date >= NOW() - INTERVAL '30 days') as offers_this_month
                FROM applications
                WHERE user_id = $1
            `, [userId]),

            // Streak — consecutive days with applications
            query(`
                SELECT application_date::date as d
                FROM applications
                WHERE user_id = $1 AND application_date IS NOT NULL
                GROUP BY d
                ORDER BY d DESC
                LIMIT 30
            `, [userId])
        ]);

        // Process skill demand heatmap
        const skillCounts = {};
        skillDemandResult.rows.forEach(row => {
            let skills = row.required_skills;
            if (typeof skills === 'string') {
                try { skills = JSON.parse(skills); } catch { skills = []; }
            }
            if (Array.isArray(skills)) {
                skills.forEach(skill => {
                    const key = skill.trim().toLowerCase();
                    if (key) skillCounts[key] = (skillCounts[key] || 0) + 1;
                });
            }
        });
        const skillHeatmap = Object.entries(skillCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15)
            .map(([skill, count]) => ({ skill, count }));

        // Calculate streak
        let streak = 0;
        if (streakResult.rows.length > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            let checkDate = today;

            for (const row of streakResult.rows) {
                const d = new Date(row.d);
                d.setHours(0, 0, 0, 0);
                const diff = Math.round((checkDate - d) / 86400000);
                if (diff <= 1) {
                    streak++;
                    checkDate = d;
                } else {
                    break;
                }
            }
        }

        // Velocity score (apps this week vs 4-week average)
        const weeklyApps = velocityResult.rows.map(r => parseInt(r.count));
        const avgWeekly = weeklyApps.length > 0 ? weeklyApps.reduce((a, b) => a + b, 0) / weeklyApps.length : 0;
        const digest = weeklyDigestResult.rows[0] || {};
        const thisWeek = parseInt(digest.this_week || 0);
        const velocityScore = avgWeekly > 0 ? Math.round((thisWeek / avgWeekly) * 100) : 0;

        // Response rate
        const total = parseInt(responseRateResult.rows[0]?.total || 0);
        const responded = parseInt(responseRateResult.rows[0]?.responded || 0);
        const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;

        return NextResponse.json({
            success: true,
            smartAnalytics: {
                velocity: {
                    score: velocityScore,
                    thisWeek,
                    avgPerWeek: parseFloat(avgWeekly.toFixed(1)),
                    trend: velocityResult.rows
                },
                responseRate: {
                    percentage: responseRate,
                    responded,
                    total
                },
                avgResponseDays: parseFloat(avgTimeResult.rows[0]?.avg_days || 0),
                skillHeatmap,
                weeklyDigest: {
                    thisWeek: parseInt(digest.this_week || 0),
                    lastWeek: parseInt(digest.last_week || 0),
                    interviewsThisWeek: parseInt(digest.interviews_this_week || 0),
                    offersThisMonth: parseInt(digest.offers_this_month || 0),
                    change: parseInt(digest.this_week || 0) - parseInt(digest.last_week || 0)
                },
                streak
            }
        });
    } catch (error) {
        console.error('Smart Analytics Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to compute analytics' }, { status: 500 });
    }
}
