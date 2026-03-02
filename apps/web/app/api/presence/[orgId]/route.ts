import { NextResponse } from 'next/server';

// In-memory storage for presence (use Redis in production)
const orgPresence = new Map<string, Set<string>>();

export async function GET(
    request: Request,
    { params }: { params: Promise<{ orgId: string }> }
) {
    const { orgId } = await params;
    const users = orgPresence.get(orgId) || new Set();
    
    return NextResponse.json({
        onlineUsers: Array.from(users),
        count: users.size,
    });
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ orgId: string }> }
) {
    const { orgId } = await params;
    const body = await request.json();
    const { userId, action } = body;

    if (!userId) {
        return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    if (!orgPresence.has(orgId)) {
        orgPresence.set(orgId, new Set());
    }

    const orgUsers = orgPresence.get(orgId)!;

    if (action === 'add') {
        orgUsers.add(userId);
    } else if (action === 'remove') {
        orgUsers.delete(userId);
        if (orgUsers.size === 0) {
            orgPresence.delete(orgId);
        }
    }

    return NextResponse.json({
        onlineUsers: Array.from(orgUsers),
        count: orgUsers.size,
    });
}
