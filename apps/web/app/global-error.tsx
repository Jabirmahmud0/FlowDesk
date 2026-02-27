'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

/**
 * Global error boundary for the Next.js app.
 * Captures unhandled errors and reports them to Sentry.
 *
 * This component is rendered by Next.js when an error occurs
 * in a page or layout component (error.tsx convention).
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        Sentry.captureException(error);
    }, [error]);

    return (
        <html>
            <body>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '100vh',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        padding: '2rem',
                        textAlign: 'center',
                    }}
                >
                    <div
                        style={{
                            width: 64,
                            height: 64,
                            borderRadius: 16,
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 24,
                            fontSize: 28,
                        }}
                    >
                        ⚠️
                    </div>
                    <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
                        Something went wrong
                    </h2>
                    <p style={{ color: '#6b7280', marginBottom: 24, maxWidth: 400 }}>
                        An unexpected error occurred. Our team has been notified and is
                        working on a fix.
                    </p>
                    <button
                        onClick={reset}
                        style={{
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 8,
                            padding: '10px 24px',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        Try Again
                    </button>
                    {error.digest && (
                        <p style={{ color: '#9ca3af', fontSize: 12, marginTop: 16 }}>
                            Error ID: {error.digest}
                        </p>
                    )}
                </div>
            </body>
        </html>
    );
}
