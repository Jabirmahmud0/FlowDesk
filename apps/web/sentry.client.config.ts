/**
 * Sentry Error Tracking Configuration
 *
 * Initializes Sentry for client-side error tracking and performance monitoring.
 * This file is loaded by Next.js's instrumentation hook.
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
    dsn: SENTRY_DSN,
    enabled: !!SENTRY_DSN,

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

    // Session Replay (only in production)
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Environment
    environment: process.env.NODE_ENV || 'development',

    // Filter out noise
    ignoreErrors: [
        // Browser extensions
        'ResizeObserver loop',
        'Non-Error promise rejection',
        // Network errors
        'Failed to fetch',
        'NetworkError',
        'Load failed',
        // Next.js internals
        'NEXT_NOT_FOUND',
        'NEXT_REDIRECT',
    ],

    // Breadcrumbs config
    beforeBreadcrumb(breadcrumb) {
        // Filter out noisy console breadcrumbs
        if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
            return null;
        }
        return breadcrumb;
    },
});
