import { auth } from '@/lib/auth';
import type { Session, Membership } from '@flowdesk/trpc';
import { db } from '@flowdesk/db';
import { orgMembers } from '@flowdesk/db';
import { eq } from 'drizzle-orm';

export async function createContext() {
    const session = (await auth()) as Session | null;

    let memberships: Membership[] = [];

    if (session?.user?.id) {
        const members = await db.query.orgMembers.findMany({
            where: eq(orgMembers.userId, session.user.id),
        });

        memberships = members.map(m => ({
            orgId: m.orgId,
            role: m.role
        }));
    }

    return {
        db,
        session,
        user: session?.user,
        memberships,
    };
}
