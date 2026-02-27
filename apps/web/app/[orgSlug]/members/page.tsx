'use client';

import { useOrg } from '@/hooks/use-org';
import { MemberList } from '@/components/members/member-list';
import { InviteMemberDialog } from '@/components/members/invite-member-dialog';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function MembersPage() {
    const { org, slug, isLoading } = useOrg();
    const { data: session } = useSession();

    if (isLoading) {
        return <div className="p-8">Loading...</div>;
    }

    if (!org) {
        return <div className="p-8">Organization not found</div>;
    }

    return (
        <div className="container mx-auto py-10">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <Link href={`/${slug}/settings`} className="text-muted-foreground hover:text-foreground flex items-center mb-2">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Settings
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight">Members</h1>
                    <p className="text-muted-foreground">
                        Manage your organization members and their roles.
                    </p>
                </div>
                <InviteMemberDialog orgId={org.id} />
            </div>

            <MemberList orgId={org.id} currentUserId={session?.user?.id || ''} />
        </div>
    );
}
