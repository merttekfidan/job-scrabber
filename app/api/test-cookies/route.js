import { NextResponse } from 'next/server';
export async function GET(req) {
    const cookies = req.headers.get('cookie') || '';
    return NextResponse.json({ success: true, receivedCookies: cookies });
}
