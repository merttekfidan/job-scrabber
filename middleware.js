import { NextResponse } from 'next/server';

export function middleware(request) {
    const response = NextResponse.next();

    // Get origin from request header
    const origin = request.headers.get('origin') || '*';
    const finalOrigin = (origin === 'null' || !origin) ? '*' : origin;

    // Set CORS headers
    response.headers.set('Access-Control-Allow-Origin', finalOrigin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
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
}

export const config = {
    matcher: '/api/:path*',
};
