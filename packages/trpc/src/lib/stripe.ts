
import Stripe from 'stripe';

const apiKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';

if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('STRIPE_SECRET_KEY is missing. Stripe features will not work.');
}

export const stripe = new Stripe(apiKey, {
    apiVersion: '2026-01-28.clover', // Use latest stable
    typescript: true,
});
