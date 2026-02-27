/**
 * Next.js Instrumentation Hook
 *
 * This file is automatically loaded by Next.js to initialize
 * instrumentation and monitoring tools (e.g., Sentry).
 */

export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        await import('./sentry.server.config');
    }

    if (process.env.NEXT_RUNTIME === 'edge') {
        await import('./sentry.edge.config');
    }
}
