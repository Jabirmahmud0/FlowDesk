'use client';

import { useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';

export function useOrg() {
    const params = useParams();
    const slug = params?.orgSlug as string | undefined;

    const { data: org, isLoading } = trpc.org.getBySlug.useQuery(
        { slug: slug! },
        { enabled: !!slug }
    );

    return { org, slug, isLoading };
}
