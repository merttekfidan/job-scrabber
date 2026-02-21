import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * Health check endpoint — returns system status for monitoring.
 * GET /api/health
 */
export async function GET() {
    const checks = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '0.1.0',
        checks: {}
    };

    // Database check
    try {
        const start = Date.now();
        await query('SELECT 1');
        checks.checks.database = { status: 'ok', latencyMs: Date.now() - start };
    } catch (e) {
        checks.status = 'degraded';
        checks.checks.database = { status: 'error', error: e.message };
    }

    // AI API key check (existence only)
    checks.checks.ai = {
        status: process.env.GROQ_API_KEY ? 'configured' : 'missing',
    };

    // Memory
    const mem = process.memoryUsage();
    checks.checks.memory = {
        heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
        rssMB: Math.round(mem.rss / 1024 / 1024),
    };

    const statusCode = checks.status === 'ok' ? 200 : 503;
    return NextResponse.json(checks, { status: statusCode });
}
