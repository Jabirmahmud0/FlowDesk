'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingOverlayProps {
    loading?: boolean;
    children: React.ReactNode;
    message?: string;
    className?: string;
}

export function LoadingOverlay({ loading, children, message, className }: LoadingOverlayProps) {
    if (!loading) {
        return <>{children}</>;
    }

    return (
        <div className={cn('relative', className)}>
            <div className="opacity-50 pointer-events-none">{children}</div>
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    {message && (
                        <p className="text-sm text-muted-foreground">{message}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

interface LoadingPageProps {
    message?: string;
}

export function LoadingPage({ message = 'Loading...' }: LoadingPageProps) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                {message && (
                    <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
                )}
            </div>
        </div>
    );
}

interface ButtonLoadingProps {
    loading?: boolean;
    children: React.ReactNode;
    className?: string;
}

export function ButtonContent({ loading, children }: ButtonLoadingProps) {
    return (
        <>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </>
    );
}
