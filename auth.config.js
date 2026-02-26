
import Credentials from "next-auth/providers/credentials"

export default {
    providers: [
        // Credentials provider is defined in auth.js for full functionality
        // Keeping an empty array here avoids conflicts while satisfying middleware requirements if needed.
        // Actually, for middleware to work with authorized callback, it needs to be valid config.
    ],
    pages: {
        signIn: '/login', // Correct signin page
        error: '/auth/error'
    },
    cookies: {
        sessionToken: {
            name: process.env.NODE_ENV === 'production'
                ? '__Secure-authjs.session-token'
                : 'authjs.session-token',
            options: {
                httpOnly: true,
                sameSite: 'none',
                path: '/',
                secure: true,
                domain: process.env.NODE_ENV === 'production' ? '.huntiq.work' : undefined,
            },
        },
        callbackUrl: {
            name: process.env.NODE_ENV === 'production'
                ? '__Secure-authjs.callback-url'
                : 'authjs.callback-url',
            options: {
                sameSite: 'none',
                path: '/',
                secure: true,
                domain: process.env.NODE_ENV === 'production' ? '.huntiq.work' : undefined,
            },
        },
        csrfToken: {
            name: process.env.NODE_ENV === 'production'
                ? '__Host-authjs.csrf-token'
                : 'authjs.csrf-token',
            options: {
                httpOnly: true,
                sameSite: 'none',
                path: '/',
                secure: true,
            },
        },
    },
    debug: true,
    trustHost: true,
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname === '/';
            const isOnLoginPage = nextUrl.pathname === '/login';
            const isSharePage = nextUrl.pathname.startsWith('/share/');

            if (isSharePage) return true; // Allow public access to share pages

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn && isOnLoginPage) {
                return Response.redirect(new URL('/', nextUrl));
            }
            return true;
        },
    },
}
