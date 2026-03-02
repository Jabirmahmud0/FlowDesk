'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LucideIcon, ClipboardList, FileText, FolderKanban, Bell, Search } from 'lucide-react';
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
        icon={ClipboardList}
        title="No tasks yet"
        description="Create your first task to get started. Tasks help you track work and collaborate with your team."
        action={{ label: 'Create Task', onClick: () => {} }}
    />
);

export const DocumentEmptyState = () => (
    <EmptyState
        icon={FileText}
        title="No documents yet"
        description="Create your first document to build a knowledge base for your team."
        action={{ label: 'Create Document', onClick: () => {} }}
    />
);

export const ProjectEmptyState = () => (
    <EmptyState
        icon={FolderKanban}
        title="No projects yet"
        description="Create your first project to organize tasks and track progress."
        action={{ label: 'Create Project', onClick: () => {} }}
    />
);

export const NotificationEmptyState = () => (
    <EmptyState
        icon={Bell}
        title="No notifications"
        description="You're all caught up! Check back later for updates."
    />
);

export const SearchEmptyState = ({ query }: { query: string }) => (
    <EmptyState
        icon={Search}
        title="No results found"
        description={`We couldn't find anything matching "${query}". Try different keywords or filters.`}
    />
);
