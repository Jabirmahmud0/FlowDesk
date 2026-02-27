'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface UpgradePromptProps {
    feature: string;
    message?: string;
}

export function UpgradePrompt({ feature, message }: UpgradePromptProps) {
    const params = useParams();
    const orgSlug = params?.orgSlug as string;

    return (
        <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Upgrade Required
                </CardTitle>
                <CardDescription>
                    {message || `You've reached the limit for ${feature} on your current plan.`}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
                    <Link href={`/${orgSlug}/settings`}>
                        <Zap className="mr-2 h-4 w-4" />
                        Upgrade Plan
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}
