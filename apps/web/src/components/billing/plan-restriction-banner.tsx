'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Zap, Building2 } from 'lucide-react';
import { Plan } from '@flowdesk/types';
import { PLAN_LIMITS } from '@flowdesk/types';
import { useRouter } from 'next/navigation';

interface PlanRestrictionBannerProps {
    currentPlan: Plan;
    feature: 'guestAccess' | 'analytics' | 'apiAccess' | 'customBranding';
    orgId: string;
}

export function PlanRestrictionBanner({ currentPlan, feature, orgId }: PlanRestrictionBannerProps) {
    const router = useRouter();
    const limits = PLAN_LIMITS[currentPlan] as any;
    const hasAccess = limits[feature];

    if (hasAccess && hasAccess !== 'basic') {
        return null;
    }

    const featureInfo: Record<string, { title: string; description: string; requiredPlan: Plan }> = {
        guestAccess: {
            title: 'Guest Access Requires Pro Plan',
            description: 'Viewer/guest access is only available on Pro and Team plans.',
            requiredPlan: 'PRO',
        },
        analytics: {
            title: 'Analytics Requires Pro Plan',
            description: 'Analytics dashboard is only available on Pro and Team plans.',
            requiredPlan: 'PRO',
        },
        apiAccess: {
            title: 'API Access Requires Pro Plan',
            description: 'API access is only available on Pro and Team plans.',
            requiredPlan: 'PRO',
        },
        customBranding: {
            title: 'Custom Branding Requires Team Plan',
            description: 'Custom branding and white-labeling is only available on Team plan.',
            requiredPlan: 'TEAM',
        },
    };

    const info = featureInfo[feature];

    return (
        <Alert className="mb-4 border-yellow-500/50 bg-yellow-500/10">
            <Lock className="h-4 w-4 text-yellow-500" />
            <AlertTitle className="text-yellow-500">{info.title}</AlertTitle>
            <AlertDescription className="flex items-center gap-2 mt-2">
                <span className="text-sm text-muted-foreground">{info.description}</span>
                <Button
                    size="sm"
                    onClick={() => router.push(`/${orgId}/settings/billing`)}
                    className="ml-auto"
                >
                    {info.requiredPlan === 'TEAM' ? (
                        <Building2 className="h-4 w-4 mr-1" />
                    ) : (
                        <Zap className="h-4 w-4 mr-1" />
                    )}
                    Upgrade to {info.requiredPlan}
                </Button>
            </AlertDescription>
        </Alert>
    );
}

export function RoleRestrictedAction({
    requiredRole,
    currentRole,
    children,
    orgId,
}: {
    requiredRole: 'ADMIN' | 'MEMBER' | 'VIEWER';
    currentRole: string;
    children: React.ReactNode;
    orgId: string;
}) {
    const router = useRouter();
    const roleHierarchy = { OWNER: 4, ADMIN: 3, MEMBER: 2, VIEWER: 1 };
    const hasAccess = roleHierarchy[currentRole as keyof typeof roleHierarchy] >= roleHierarchy[requiredRole];

    if (hasAccess) {
        return <>{children}</>;
    }

    return (
        <div className="relative">
            <div className="opacity-50 pointer-events-none grayscale">{children}</div>
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/${orgId}/settings/billing`)}
                >
                    <Lock className="h-3 w-3 mr-1" />
                    Upgrade Role
                </Button>
            </div>
        </div>
    );
}
