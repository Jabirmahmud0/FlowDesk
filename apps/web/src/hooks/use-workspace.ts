'use client';

import { useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useOrg } from '@/hooks/use-org';

export function useWorkspace() {
    const { org, isLoading: isOrgLoading } = useOrg();
    const params = useParams();
    const orgSlug = params?.orgSlug as string | undefined;
    const wsSlug = params?.wsSlug as string | undefined;

    const { data: workspace, isLoading: isWsQueryLoading, error, refetch } = trpc.workspace.getBySlug.useQuery(
        { orgId: org?.id!, slug: wsSlug! },
        {
            enabled: !!org?.id && !!wsSlug,
            retry: 2,
            retryDelay: 500,
            staleTime: 5 * 60 * 1000, // 5 minutes
        }
    );

    const isLoading = isOrgLoading || isWsQueryLoading || !wsSlug;

    return { workspace, orgSlug, wsSlug, isLoading, error, refetch };
}
