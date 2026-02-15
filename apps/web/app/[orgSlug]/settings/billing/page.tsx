'use client';

import { useOrg } from '@/hooks/use-org';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

const PLANS = [
    {
        id: 'FREE',
        name: 'Free',
        price: '$0',
        description: 'Perfect for small teams and hobbyists.',
        features: ['Up to 5 members', 'Unlimited tasks', 'Basic notifications'],
    },
    {
        id: 'PRO',
        name: 'Pro',
        price: '$12',
        description: 'For growing teams that need more power.',
        features: ['Unlimited members', 'Advanced analytics', 'Priority support', 'Private projects'],
    },
    {
        id: 'TEAM',
        name: 'Team',
        price: '$49',
        description: 'Enterprise-grade control and security.',
        features: ['SSO', 'Audit logs', 'Dedicated success manager', 'SLA'],
    },
];

export default function BillingPage() {
    const { org } = useOrg();
    const router = useRouter();
    const searchParams = useSearchParams();
    const utils = trpc.useUtils();

    const { data: subscription, isLoading } = trpc.billing.getSubscription.useQuery(
        { orgId: org?.id! },
        { enabled: !!org?.id }
    );

    const checkoutMutation = trpc.billing.createCheckoutSession.useMutation({
        onSuccess: ({ url }) => {
            if (url) window.location.href = url;
        },
        onError: (err) => {
            toast.error(err.message);
        }
    });

    const portalMutation = trpc.billing.createPortalSession.useMutation({
        onSuccess: ({ url }) => {
            if (url) window.location.href = url;
        },
        onError: (err) => {
            toast.error(err.message);
        }
    });

    useEffect(() => {
        if (searchParams?.get('success')) {
            toast.success('Subscription updated successfully!');
            utils.billing.getSubscription.invalidate();
            router.replace(window.location.pathname);
        }
        if (searchParams?.get('canceled')) {
            toast.error('Subscription update canceled.');
            router.replace(window.location.pathname);
        }
    }, [searchParams, router, utils]);

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    const currentPlan = subscription?.plan || 'FREE';

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Subscription</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage your billing and subscription plan.
                    </p>
                </div>
                {subscription?.stripeSubId && (
                    <Button
                        variant="outline"
                        onClick={() => portalMutation.mutate({ orgId: org?.id! })}
                        disabled={portalMutation.isPending}
                    >
                        {portalMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Manage Subscription
                    </Button>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {PLANS.map((plan) => {
                    const isCurrent = currentPlan === plan.id;
                    return (
                        <Card key={plan.id} className={cn(isCurrent && "border-primary shadow-lg scale-105")}>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    {plan.name}
                                    {isCurrent && <Badge>Current</Badge>}
                                </CardTitle>
                                <CardDescription>{plan.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold mb-6">
                                    {plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                                </div>
                                <ul className="space-y-2 text-sm">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-center">
                                            <Check className="mr-2 h-4 w-4 text-primary" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                {isCurrent ? (
                                    <Button className="w-full" disabled variant="secondary">Current Plan</Button>
                                ) : (
                                    <Button
                                        className="w-full"
                                        onClick={() => checkoutMutation.mutate({ orgId: org?.id!, plan: plan.id as any })}
                                        disabled={checkoutMutation.isPending || (currentPlan !== 'FREE' && plan.id === 'FREE')} // Cannot upgrade to Free easily here, usually done via portal
                                    >
                                        {checkoutMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (currentPlan === 'FREE' ? 'Upgrade' : 'Switch')}
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

// Utility for cn
import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
