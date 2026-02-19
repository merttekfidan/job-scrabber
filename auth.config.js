
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
    debug: true,
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname === '/';
            const isOnLoginPage = nextUrl.pathname === '/login'; // Or check regex for auth pages

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
