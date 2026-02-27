import type { NextAuthConfig } from 'next-auth';

const isProduction = process.env.NODE_ENV === 'production';

export default {
  providers: [],
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  cookies: {
    sessionToken: {
      name: isProduction ? '__Secure-authjs.session-token' : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'none' as const,
        path: '/',
        secure: isProduction,
        // No domain — host-only cookie so extension credentialed requests receive it
      },
    },
    callbackUrl: {
      name: isProduction ? '__Secure-authjs.callback-url' : 'authjs.callback-url',
      options: {
        sameSite: 'none' as const,
        path: '/',
        secure: isProduction,
      },
    },
    csrfToken: {
      name: isProduction ? '__Host-authjs.csrf-token' : 'authjs.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'none' as const,
        path: '/',
        secure: isProduction,
      },
    },
  },
  debug: true,
  trustHost: true,
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
        console.error('[Auth] authorized callback error:', err);
        return false;
      }
    },
  },
} satisfies NextAuthConfig;
