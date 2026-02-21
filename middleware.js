import NextAuth from "next-auth"
import authConfig from "./auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

// CORS whitelist — only these origins can make API requests
const ALLOWED_ORIGINS = [
    process.env.NEXT_PUBLIC_APP_URL,                      // Production domain
    'https://aware-endurance-production-13b8.up.railway.app',
    process.env.NODE_ENV !== 'production' && 'http://localhost:3000',
].filter(Boolean);

// Chrome extension origins (chrome-extension://ID)
const EXTENSION_ORIGIN_PATTERN = /^chrome-extension:\/\/[a-z]{32}$/;

function isAllowedOrigin(origin) {
    if (!origin) return true; // Same-origin requests have no origin header
    if (ALLOWED_ORIGINS.includes(origin)) return true;
    if (EXTENSION_ORIGIN_PATTERN.test(origin)) return true;
    return false;
}

export default auth(async function middleware(req) {
    const origin = req.headers.get('origin');

    // Block requests from disallowed origins
    if (origin && !isAllowedOrigin(origin)) {
        return new NextResponse(null, {
            status: 403,
            statusText: 'Forbidden',
            headers: { 'Content-Type': 'text/plain' },
        });
    }

    const response = NextResponse.next();

    // Set CORS headers only for allowed origins
    const corsOrigin = origin && isAllowedOrigin(origin) ? origin : '';
    if (corsOrigin) {
        response.headers.set('Access-Control-Allow-Origin', corsOrigin);
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return new NextResponse(null, {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': corsOrigin || '',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Credentials': 'true',
            },
        });
    }

    return response;
})

// Configure Matcher
export const config = {
    // Match all paths except static files and images
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
