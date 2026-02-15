import { NextResponse } from 'next/server';

export async function GET() {
    console.log('[API] /api/ping hit');
    return NextResponse.json({ message: 'pong' });
}
