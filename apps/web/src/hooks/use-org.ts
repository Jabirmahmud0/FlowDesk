'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { trpc } from '@/lib/trpc';

export function useOrg() {
    const params = useParams();
    const router = useRouter();
    const slug = params?.orgSlug as string | undefined;

    const { data: org, isLoading: isQueryLoading, error, isError } = trpc.org.getBySlug.useQuery(
        { slug: slug! },
        {
            enabled: !!slug,
            retry: (failureCount, error) => {
                // Don't retry on not-found/access errors or network errors during navigation
                if (error.message?.includes('not found') || error.message?.includes('not a member')) return false;
                if (error.message?.includes('Failed to fetch')) return false;
                return failureCount < 2;
            }
        }
    );

    const isLoading = isQueryLoading || !slug;

    // First-time users: org not found or no membership → onboarding wizard
    useEffect(() => {
        if (isError && error?.message &&
            (error.message.includes('not found') || error.message.includes('not a member'))) {
            router.replace('/onboarding');
        }
    }, [isError, error, router]);

    return { org, slug, isLoading, error, isError };
}
