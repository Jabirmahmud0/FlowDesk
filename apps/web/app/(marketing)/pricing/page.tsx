'use client';

import Link from 'next/link';
import { Check, Zap, Building2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const plans = [
    {
        name: 'Free',
        price: '$0',
        period: 'forever',
        description: 'For small teams getting started',
        features: [
            '3 team members',
            '3 projects',
            '100MB storage',
            '7-day activity log',
            'Basic Kanban board',
            'Community support',
        ],
        cta: 'Get Started',
        href: '/register',
        popular: false,
        icon: null,
    },
    {
        name: 'Pro',
        price: '$12',
        period: '/month per org',
        description: 'For growing teams that need more power',
        features: [
            '10 team members',
            'Unlimited projects',
            '5GB storage',
            '90-day activity log',
            'Guest access',
            'Analytics dashboard',
            'Priority support',
            'Custom workflows',
        ],
        cta: 'Start Pro Trial',
        href: '/register?plan=pro',
        popular: true,
        icon: Zap,
    },
    {
        name: 'Team',
        price: '$29',
        period: '/month per org',
        description: 'For organizations at scale',
        features: [
            'Unlimited members',
            'Unlimited projects',
            '20GB storage',
            'Unlimited activity log',
            'Advanced analytics',
            'Custom branding',
            'SSO & SAML',
            'Dedicated support',
            'SLA guarantee',
        ],
        cta: 'Contact Sales',
        href: '/register?plan=team',
        popular: false,
        icon: Building2,
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
    },
};

export default function PricingPage() {
    return (
        <div className="pt-24 pb-16">
            {/* Header */}
            <section className="text-center px-6 mb-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
                        Simple, transparent{' '}
                        <span className="gradient-text">pricing</span>
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-lg mx-auto">
                        Start free. Upgrade as your team grows. No hidden fees, no surprises.
                    </p>
                </motion.div>
            </section>

            {/* Plans */}
            <motion.section
                className="mx-auto max-w-6xl px-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="grid md:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <motion.div
                            key={plan.name}
                            variants={cardVariants}
                            className={`relative rounded-2xl border p-8 flex flex-col ${plan.popular
                                ? 'border-primary shadow-2xl shadow-primary/15 scale-[1.03] bg-card'
                                : 'border-border/60 bg-card hover:border-primary/30 transition-colors'
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full gradient-primary text-white text-xs font-semibold tracking-wide uppercase">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-6">
                                {plan.icon && (
                                    <plan.icon className="w-6 h-6 text-primary mb-3" />
                                )}
                                <h3 className="text-xl font-bold">{plan.name}</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {plan.description}
                                </p>
                            </div>

                            <div className="mb-6">
                                <span className="text-5xl font-extrabold tracking-tight">
                                    {plan.price}
                                </span>
                                <span className="text-muted-foreground text-sm ml-1">
                                    {plan.period}
                                </span>
                            </div>

                            <ul className="space-y-3 mb-8 flex-1">
                                {plan.features.map((feature) => (
                                    <li
                                        key={feature}
                                        className="flex items-center gap-3 text-sm"
                                    >
                                        <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                                            <Check className="w-3 h-3 text-success" />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href={plan.href}
                                className={`w-full py-3 rounded-xl text-center text-sm font-semibold transition-all inline-flex items-center justify-center gap-2 ${plan.popular
                                    ? 'gradient-primary text-white hover:opacity-90 shadow-lg shadow-primary/20'
                                    : 'bg-secondary text-secondary-foreground hover:bg-accent'
                                    }`}
                            >
                                {plan.cta}
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </motion.section>

            {/* FAQ */}
            <section className="mx-auto max-w-3xl px-6 mt-24">
                <h2 className="text-2xl font-bold text-center mb-10">
                    Frequently Asked Questions
                </h2>
                <div className="space-y-6">
                    {[
                        {
                            q: 'Can I change plans later?',
                            a: 'Yes! You can upgrade, downgrade, or cancel anytime from your billing settings. Changes take effect immediately.',
                        },
                        {
                            q: 'Is there a free trial for Pro?',
                            a: 'Yes, Pro comes with a 14-day free trial. No credit card required.',
                        },
                        {
                            q: 'What happens if I exceed my plan limits?',
                            a: "You'll receive a notification and be prompted to upgrade. Existing data is never deleted.",
                        },
                        {
                            q: 'Do you offer discounts for nonprofits?',
                            a: 'Yes! Contact us at support@flowdesk.app for special nonprofit pricing.',
                        },
                    ].map((faq) => (
                        <div
                            key={faq.q}
                            className="border border-border/60 rounded-xl p-6 bg-card"
                        >
                            <h3 className="font-semibold mb-2">{faq.q}</h3>
                            <p className="text-sm text-muted-foreground">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
