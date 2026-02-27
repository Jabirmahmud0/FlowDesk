
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { organizations, subscriptions } from '@flowdesk/db';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

export async function POST(req: Request) {
    const body = await req.text();
    const hdrs = await headers();
    const signature = hdrs.get('Stripe-Signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const subscription = event.data.object as any;

    if (event.type === 'checkout.session.completed') {
        if (!session?.metadata?.orgId) {
            return new NextResponse('Org ID is missing in metadata', { status: 400 });
        }

        const subscriptionId = session.subscription as string;

        // Fetch subscription details to get start/end dates
        const sub = await stripe.subscriptions.retrieve(subscriptionId) as any;
        const planId = sub.items.data[0].price.id;

        // Map price ID to plan enum
        let plan: 'FREE' | 'PRO' | 'TEAM' = 'FREE';
        if (planId === process.env.STRIPE_PRICE_ID_PRO) plan = 'PRO';
        if (planId === process.env.STRIPE_PRICE_ID_TEAM) plan = 'TEAM';

        // Upsert subscription (uses actual schema columns)
        await db.insert(subscriptions).values({
            orgId: session.metadata.orgId,
            stripeSubId: subscriptionId,
            plan,
            status: sub.status === 'active' ? 'ACTIVE' : sub.status === 'past_due' ? 'PAST_DUE' : sub.status === 'trialing' ? 'TRIALING' : 'CANCELED',
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
        }).onConflictDoUpdate({
            target: subscriptions.orgId,
            set: {
                stripeSubId: subscriptionId,
                plan,
                status: (sub.status === 'active' ? 'ACTIVE' : sub.status === 'past_due' ? 'PAST_DUE' : sub.status === 'trialing' ? 'TRIALING' : 'CANCELED') as any,
                currentPeriodEnd: new Date(sub.current_period_end * 1000),
                updatedAt: new Date(),
            }
        });
    }

    if (event.type === 'customer.subscription.updated') {
        const priceId = subscription.items.data[0].price.id;
        let plan: 'FREE' | 'PRO' | 'TEAM' = 'FREE';
        if (priceId === process.env.STRIPE_PRICE_ID_PRO) plan = 'PRO';
        if (priceId === process.env.STRIPE_PRICE_ID_TEAM) plan = 'TEAM';

        await db.update(subscriptions)
            .set({
                plan,
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                status: subscription.status === 'active' ? 'ACTIVE' : subscription.status === 'past_due' ? 'PAST_DUE' : 'CANCELED',
                updatedAt: new Date(),
            })
            .where(eq(subscriptions.stripeSubId, subscription.id));
    }

    if (event.type === 'customer.subscription.deleted') {
        await db.update(subscriptions)
            .set({
                status: 'CANCELED',
                plan: 'FREE',
                updatedAt: new Date(),
            })
            .where(eq(subscriptions.stripeSubId, subscription.id));
    }

    return new NextResponse(null, { status: 200 });
}

