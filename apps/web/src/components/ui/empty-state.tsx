'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    actionHref?: string;
    className?: string;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    actionHref,
    className,
}: EmptyStateProps) {
    const router = useRouter();

    const handleAction = () => {
        if (action?.onClick) {
            action.onClick();
        } else if (actionHref) {
            router.push(actionHref);
        }
    };

    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center text-center p-8 min-h-[400px]',
                className
            )}
        >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Icon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-6">{description}</p>
            {action && (
                <Button onClick={handleAction}>
                    {action.label}
                </Button>
            )}
        </div>
    );
}

// Preset empty states for common use cases
export const TaskEmptyState = () => (
    <EmptyState
        icon={() => (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
        )}
        title="No tasks yet"
        description="Create your first task to get started. Tasks help you track work and collaborate with your team."
        action={{ label: 'Create Task', onClick: () => {} }}
    />
);

export const DocumentEmptyState = () => (
    <EmptyState
        icon={() => (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        )}
        title="No documents yet"
        description="Create your first document to build a knowledge base for your team."
        action={{ label: 'Create Document', onClick: () => {} }}
    />
);

export const ProjectEmptyState = () => (
    <EmptyState
        icon={() => (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
        )}
        title="No projects yet"
        description="Create your first project to organize tasks and track progress."
        action={{ label: 'Create Project', onClick: () => {} }}
    />
);

export const NotificationEmptyState = () => (
    <EmptyState
        icon={() => (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
        )}
        title="No notifications"
        description="You're all caught up! Check back later for updates."
    />
);

export const SearchEmptyState = ({ query }: { query: string }) => (
    <EmptyState
        icon={() => (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
        )}
        title="No results found"
        description={`We couldn't find anything matching "${query}". Try different keywords or filters.`}
    />
);
