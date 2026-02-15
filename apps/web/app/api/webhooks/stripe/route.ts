
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { organizations, subscriptions } from '@flowdesk/db/schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

export async function POST(req: Request) {
    const body = await req.text();
    const signature = headers().get('Stripe-Signature') as string;

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
    const subscription = event.data.object as Stripe.Subscription;

    if (event.type === 'checkout.session.completed') {
        if (!session?.metadata?.orgId) {
            return new NextResponse('Org ID is missing in metadata', { status: 400 });
        }

        const subscriptionId = session.subscription as string;

        // Fetch subscription details to get start/end dates
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const planId = sub.items.data[0].price.id;

        // Map price ID to plan enum
        let plan: 'FREE' | 'PRO' | 'TEAM' = 'FREE';
        if (planId === process.env.STRIPE_PRICE_ID_PRO) plan = 'PRO';
        if (planId === process.env.STRIPE_PRICE_ID_TEAM) plan = 'TEAM';

        // Upsert subscription
        await db.insert(subscriptions).values({
            stripeCustomerId: session.customer as string,
            stripeSubId: subscriptionId,
            stripePriceId: planId,
            stripeCurrentPeriodEnd: new Date(sub.current_period_end * 1000),
            plan,
            status: sub.status as any,
        }).onConflictDoUpdate({
            target: subscriptions.stripeSubId,
            set: {
                stripePriceId: planId,
                stripeCurrentPeriodEnd: new Date(sub.current_period_end * 1000),
                plan,
                status: sub.status as any,
            }
        });

        // Link to Org if not already linked (though relation is 1:1 on org side usually, or sub side?)
        // Schema Step 558: `subscriptions` has `id`. `organizations` has `subscriptionId`.
        // So we need to update organization with the new subscription ID.
        // Wait, `subscriptions` table likely has an ID we generate? Or use `stripeSubId`?
        // Schema Step 558: `subscriptions` usually matches `stripeSubId`?
        // Let's assume `subscriptions` table has a uuid PK.
        // I need to get the inserted subscription's ID.

        const [insertedSub] = await db.select().from(subscriptions).where(eq(subscriptions.stripeSubId, subscriptionId));

        if (insertedSub) {
            await db.update(organizations)
                .set({ subscriptionId: insertedSub.id })
                .where(eq(organizations.id, session.metadata.orgId));
        }
    }

    if (event.type === 'customer.subscription.updated') {
        await db.update(subscriptions)
            .set({
                stripePriceId: subscription.items.data[0].price.id,
                stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
                status: subscription.status as any,
            })
            .where(eq(subscriptions.stripeSubId, subscription.id));
    }

    if (event.type === 'customer.subscription.deleted') {
        await db.update(subscriptions)
            .set({
                status: 'canceled',
                plan: 'FREE',
            })
            .where(eq(subscriptions.stripeSubId, subscription.id));
    }

    return new NextResponse(null, { status: 200 });
}
