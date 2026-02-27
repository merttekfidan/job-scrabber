import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  'https://aware-endurance-production-13b8.up.railway.app',
  'https://www.huntiq.work',
  'https://huntiq.work',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:3002',
  'http://127.0.0.1:3002',
  'http://localhost:3005',
  'http://127.0.0.1:3005',
  'http://localhost:3006',
  'http://127.0.0.1:3006',
].filter(Boolean) as string[];

const EXTENSION_ORIGIN_PATTERN = /^chrome-extension:\/\/[a-z0-9]{32}$/;

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (EXTENSION_ORIGIN_PATTERN.test(origin)) return true;
  return false;
}

export default function middleware(req: NextRequest) {
  try {
    const origin = req.headers.get('origin');

    if (origin && !isAllowedOrigin(origin)) {
      return new NextResponse(null, {
        status: 403,
        statusText: 'Forbidden',
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    if (req.method === 'OPTIONS') {
      const corsOrigin = origin && isAllowedOrigin(origin) ? origin : '';
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': corsOrigin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
        },
      });
    }

    const response = NextResponse.next();
    const corsOrigin = origin && isAllowedOrigin(origin) ? origin : '';
    if (corsOrigin) {
      response.headers.set('Access-Control-Allow-Origin', corsOrigin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
    return response;
  } catch (err) {
    console.error('[Middleware] Error:', err);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error', message: (err as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
