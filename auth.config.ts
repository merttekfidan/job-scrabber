import type { NextAuthConfig } from 'next-auth';
import logger from '@/lib/logger';

const isProduction = process.env.NODE_ENV === 'production';

export default {
  providers: [],
  session: { strategy: 'jwt' },
  trustHost: true,
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  cookies: {
    sessionToken: {
      name: isProduction ? '__Secure-authjs.session-token' : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: isProduction ? 'none' as const : 'lax' as const,
        path: '/',
        secure: isProduction,
      },
    },
    callbackUrl: {
      name: isProduction ? '__Secure-authjs.callback-url' : 'authjs.callback-url',
      options: {
        sameSite: isProduction ? 'none' as const : 'lax' as const,
        path: '/',
        secure: isProduction,
      },
    },
    csrfToken: {
      name: isProduction ? '__Host-authjs.csrf-token' : 'authjs.csrf-token',
      options: {
        httpOnly: true,
        sameSite: isProduction ? 'none' as const : 'lax' as const,
        path: '/',
        secure: isProduction,
      },
    },
  },
  debug: true,
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      try {
        const isLoggedIn = !!auth?.user;
        const isOnRoot = nextUrl.pathname === '/';
        const isOnLoginPage = nextUrl.pathname === '/login';
        const isSharePage = nextUrl.pathname.startsWith('/share/');

        if (isSharePage) return true;

        if (isOnRoot) {
          if (isLoggedIn) return true;
          return false;
        }
        if (isLoggedIn && isOnLoginPage) {
          return Response.redirect(new URL('/', nextUrl));
        }
        return true;
      } catch (err) {
        logger.error('Auth authorized callback failed', { message: err instanceof Error ? err.message : String(err) });
        return false;
      }
    },
  },
} satisfies NextAuthConfig;
