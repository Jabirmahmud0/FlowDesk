
import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { stripe } from '../lib/stripe';
import { subscriptions, organizations } from '@flowdesk/db';
import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

const PLANS = {
    FREE: {
        name: 'Free',
        priceId: '', // Free
    },
    PRO: {
        name: 'Pro',
        priceId: process.env.STRIPE_PRICE_ID_PRO,
    },
    TEAM: {
        name: 'Team',
        priceId: process.env.STRIPE_PRICE_ID_TEAM,
    },
};

export const billingRouter = router({
    getSubscription: protectedProcedure
        .input(z.object({ orgId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const org = await ctx.db.query.organizations.findFirst({
                where: eq(organizations.id, input.orgId),
                with: {
                    subscription: true,
                },
            });

            if (!org) throw new TRPCError({ code: 'NOT_FOUND', message: 'Org not found' });

            return org.subscription;
        }),

    createCheckoutSession: protectedProcedure
        .input(z.object({ orgId: z.string().uuid(), plan: z.enum(['PRO', 'TEAM']) }))
        .mutation(async ({ ctx, input }) => {
            const org = await ctx.db.query.organizations.findFirst({
                where: eq(organizations.id, input.orgId),
            });

            if (!org) throw new TRPCError({ code: 'NOT_FOUND' });

            // Ensure user is owner/admin (TODO: Check RBAC)

            const priceId = PLANS[input.plan].priceId;
            if (!priceId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid plan' });

            const session = await stripe.checkout.sessions.create({
                mode: 'subscription',
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                metadata: {
                    orgId: input.orgId,
                    userId: ctx.user.id,
                },
                success_url: `${process.env.NEXT_PUBLIC_APP_URL}/${org.slug}/settings/billing?success=true`,
                cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/${org.slug}/settings/billing?canceled=true`,
                customer_email: ctx.user.email,
            });

            return { url: session.url };
        }),

    createPortalSession: protectedProcedure
        .input(z.object({ orgId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const org = await ctx.db.query.organizations.findFirst({
                where: eq(organizations.id, input.orgId),
                with: { subscription: true }
            });

            if (!org?.subscription?.stripeSubId) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'No subscription found' });
            }

            // Get customer ID from subscription (we need to store customerId in DB actually, 
            // but for now we can retrieve it via filtering or if we stored it)
            // Schema `subscriptions` (Step 558) has `stripeSubId`.
            // We can fetch the sub from Stripe to get customer ID.

            const subscription = await stripe.subscriptions.retrieve(org.subscription.stripeSubId);

            const session = await stripe.billingPortal.sessions.create({
                customer: subscription.customer as string,
                return_url: `${process.env.NEXT_PUBLIC_APP_URL}/${org.slug}/settings/billing`,
            });

            return { url: session.url };
        }),
});
