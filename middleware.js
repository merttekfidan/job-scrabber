<<<<<<< HEAD

import NextAuth from "next-auth"
import authConfig from "./auth.config"

export const { auth: middleware } = NextAuth(authConfig)
=======
import NextAuth from "next-auth"
import authConfig from "./auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth(async function middleware(req) {
    // 1. Run Auth Middleware (handled by wrapper)
    // Note: The wrapper attaches 'auth' object to req

    // 2. CORS Logic
    const response = NextResponse.next();

    // Get origin from request header
    const origin = req.headers.get('origin') || '*';
    const finalOrigin = (origin === 'null' || !origin) ? '*' : origin;

    // Set CORS headers
    response.headers.set('Access-Control-Allow-Origin', finalOrigin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return new NextResponse(null, {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': finalOrigin,
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });
    }

    return response;
})
>>>>>>> dev

// Configure Matcher
export const config = {
<<<<<<< HEAD
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
=======
    // Match all paths except static files and images
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
>>>>>>> dev
}
