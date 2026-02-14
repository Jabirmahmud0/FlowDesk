'use client';

import { useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useOrg } from '@/hooks/use-org';

export function useWorkspace() {
    const { org } = useOrg();
    const params = useParams();
    const orgSlug = params?.orgSlug as string | undefined;
    const wsSlug = params?.wsSlug as string | undefined;

    const { data: workspace, isLoading } = trpc.workspace.getBySlug.useQuery(
        { orgId: org?.id!, slug: wsSlug! },
        { enabled: !!org?.id && !!wsSlug }
    );

    return { workspace, orgSlug, wsSlug, isLoading };
}
