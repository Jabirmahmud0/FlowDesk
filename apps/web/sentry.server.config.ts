/**
 * Sentry Server-Side Configuration
 *
 * Initializes Sentry for server-side error tracking and performance monitoring.
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
    dsn: SENTRY_DSN,
    enabled: !!SENTRY_DSN,

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

    // Environment
    environment: process.env.NODE_ENV || 'development',

    // Attach server context
    beforeSend(event) {
        // Scrub sensitive data
        if (event.request?.headers) {
            delete event.request.headers['authorization'];
            delete event.request.headers['cookie'];
        }
        return event;
    },
});
