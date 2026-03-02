import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { auth } from '@/auth-edge';
import logger from '@/lib/logger';

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

// Chrome extension IDs are typically 32 lowercase hex; allow any length for compatibility
const EXTENSION_ORIGIN_PATTERN = /^chrome-extension:\/\/[a-z0-9]+$/;

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (EXTENSION_ORIGIN_PATTERN.test(origin)) return true;
  return false;
}

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/kanban',
  '/coach',
  '/application/',
  '/dev/data-layer-test',
];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) =>
    pathname === prefix || pathname.startsWith(prefix + '/')
  );
}

const CANONICAL_HOST = 'www.huntiq.work';

export default auth((req: NextRequest & { auth: Session | null }) => {
  try {
    const host = req.headers.get('host') ?? '';
    const pathname = req.nextUrl.pathname;

    // Apex → www redirect (Railway: add both domains; this makes apex point to www)
    if (process.env.NODE_ENV === 'production' && host === 'huntiq.work') {
      const url = new URL(req.url);
      url.host = CANONICAL_HOST;
      url.protocol = 'https:';
      return NextResponse.redirect(url.toString(), 308);
    }

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
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-dev-extension',
          'Access-Control-Allow-Credentials': 'true',
        },
      });
    }

    const isLoggedIn = !!req.auth?.user;

    if (isProtectedPath(pathname) && !isLoggedIn) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (pathname === '/login' && isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    const response = NextResponse.next();
    const corsOrigin = origin && isAllowedOrigin(origin) ? origin : '';
    if (corsOrigin) {
      response.headers.set('Access-Control-Allow-Origin', corsOrigin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-dev-extension');
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
    return response;
  } catch (err) {
    logger.error('Middleware error', { message: err instanceof Error ? err.message : String(err) });
    return new NextResponse(
      JSON.stringify({
        error: 'Internal server error',
        message: (err as Error).message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
