import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@flowdesk/db';
import { orgMembers } from '@flowdesk/db';
import { eq } from 'drizzle-orm';

export default async function DashboardRedirect() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login');
    }

    // Get user's first organization
    const membership = await db.query.orgMembers.findFirst({
        where: eq(orgMembers.userId, session.user.id),
        with: {
            organization: true,
        },
    });

    if (membership?.organization) {
        redirect(`/${membership.organization.slug}`);
    }

    // No orgs found, redirect to create org
    redirect('/create-org');
}
