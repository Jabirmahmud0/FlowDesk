'use client';

import { formatDistanceToNow } from 'date-fns';
import {
    FileText,
    CheckSquare,
    MessageSquare,
    Folder,
    User,
    CircleDot,
    CheckCircle2,
    AlertCircle,
    Trash2,
    RotateCcw,
    Star,
    Move,
    Edit3,
    Plus,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type ActivityType = {
    id: string;
    action: string;
    createdAt: string | Date;
    metadata: Record<string, any> | null;
    user: {
        id: string;
        name: string;
        email: string;
        avatarUrl?: string | null;
    } | null;
    task?: {
        id: string;
        title: string;
    } | null;
    project?: {
        id: string;
        name: string;
    } | null;
    document?: {
        id: string;
        title: string;
    } | null;
};

type ActivityFeedProps = {
    activities: ActivityType[];
    className?: string;
    showHeader?: boolean;
    limit?: number;
};

const actionConfig: Record<
    string,
    {
        icon: React.ComponentType<{ className?: string }>;
        color: string;
        bg: string;
        label: string;
    }
> = {
    TASK_CREATED: {
        icon: Plus,
        color: 'text-green-600',
        bg: 'bg-green-500/10',
        label: 'created task',
    },
    TASK_UPDATED: {
        icon: Edit3,
        color: 'text-blue-600',
        bg: 'bg-blue-500/10',
        label: 'updated task',
    },
    TASK_STATUS_CHANGED: {
        icon: CircleDot,
        color: 'text-amber-600',
        bg: 'bg-amber-500/10',
        label: 'changed task status',
    },
    TASK_ASSIGNEE_CHANGED: {
        icon: User,
        color: 'text-purple-600',
        bg: 'bg-purple-500/10',
        label: 'changed assignee',
    },
    TASK_MOVED: {
        icon: Move,
        color: 'text-cyan-600',
        bg: 'bg-cyan-500/10',
        label: 'moved task',
    },
    TASK_DELETED: {
        icon: Trash2,
        color: 'text-red-600',
        bg: 'bg-red-500/10',
        label: 'deleted task',
    },
    PROJECT_CREATED: {
        icon: Folder,
        color: 'text-green-600',
        bg: 'bg-green-500/10',
        label: 'created project',
    },
    PROJECT_STATUS_CHANGED: {
        icon: CircleDot,
        color: 'text-amber-600',
        bg: 'bg-amber-500/10',
        label: 'changed project status',
    },
    PROJECT_DELETED: {
        icon: Trash2,
        color: 'text-red-600',
        bg: 'bg-red-500/10',
        label: 'deleted project',
    },
    DOCUMENT_CREATED: {
        icon: FileText,
        color: 'text-green-600',
        bg: 'bg-green-500/10',
        label: 'created document',
    },
    DOCUMENT_UPDATED: {
        icon: Edit3,
        color: 'text-blue-600',
        bg: 'bg-blue-500/10',
        label: 'updated document',
    },
    DOCUMENT_DELETED: {
        icon: Trash2,
        color: 'text-red-600',
        bg: 'bg-red-500/10',
        label: 'deleted document',
    },
    COMMENT_ADDED: {
        icon: MessageSquare,
        color: 'text-indigo-600',
        bg: 'bg-indigo-500/10',
        label: 'added comment',
    },
    COMMENT_DELETED: {
        icon: Trash2,
        color: 'text-red-600',
        bg: 'bg-red-500/10',
        label: 'deleted comment',
    },
    DOCUMENT_COMMENT_ADDED: {
        icon: MessageSquare,
        color: 'text-indigo-600',
        bg: 'bg-indigo-500/10',
        label: 'added comment',
    },
    DOCUMENT_COMMENT_REPLY: {
        icon: MessageSquare,
        color: 'text-indigo-600',
        bg: 'bg-indigo-500/10',
        label: 'replied to comment',
    },
    DOCUMENT_COMMENT_RESOLVED: {
        icon: CheckCircle2,
        color: 'text-green-600',
        bg: 'bg-green-500/10',
        label: 'resolved comment',
    },
    DOCUMENT_COMMENT_REOPENED: {
        icon: AlertCircle,
        color: 'text-amber-600',
        bg: 'bg-amber-500/10',
        label: 'reopened comment',
    },
    DOCUMENT_COMMENT_DELETED: {
        icon: Trash2,
        color: 'text-red-600',
        bg: 'bg-red-500/10',
        label: 'deleted comment',
    },
};

function getActivityMessage(activity: ActivityType): string {
    const config = actionConfig[activity.action];
    const userName = activity.user?.name || activity.user?.email || 'Someone';
    const metadata = activity.metadata;

    if (!config) {
        return `${userName} performed an action`;
    }

    let message = `${userName} ${config.label}`;

    // Add task/project/document context
    if (activity.task?.title) {
        message += ` "${activity.task.title}"`;
    } else if (activity.document?.title) {
        message += ` "${activity.document.title}"`;
    } else if (activity.project?.name) {
        message += ` "${activity.project.name}"`;
    } else if (metadata?.title) {
        message += ` "${metadata.title}"`;
    }

    // Add specific details
    if (activity.action === 'TASK_STATUS_CHANGED' && metadata?.from && metadata?.to) {
        message += ` from ${metadata.from.replace(/_/g, ' ')} to ${metadata.to.replace(/_/g, ' ')}`;
    }

    if (activity.action === 'TASK_MOVED' && metadata?.from && metadata?.to) {
        message += ` to ${metadata.to.replace(/_/g, ' ')}`;
    }

    if (activity.action === 'DOCUMENT_UPDATED' && metadata?.version) {
        message += ` (v${metadata.version})`;
    }

    if (activity.action === 'DOCUMENT_UPDATED' && metadata?.changeNote) {
        message += ` - ${metadata.changeNote}`;
    }

    return message;
}

export function ActivityFeed({
    activities,
    className,
    showHeader = true,
}: ActivityFeedProps) {
    if (!activities || activities.length === 0) {
        return (
            <div className={cn('flex flex-col items-center justify-center py-8 text-center', className)}>
                <CircleDot className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No activity yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                    Actions will appear here as they happen
                </p>
            </div>
        );
    }

    return (
        <div className={cn('flex flex-col', className)}>
            {showHeader && (
                <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="font-semibold text-sm">Activity</h3>
                    <Badge variant="secondary" className="text-xs">
                        {activities.length} {activities.length === 1 ? 'event' : 'events'}
                    </Badge>
                </div>
            )}

            <ScrollArea className="flex-1" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                <div className="space-y-0">
                    {activities.map((activity, index) => {
                        const config = actionConfig[activity.action] || {
                            icon: CircleDot,
                            color: 'text-muted-foreground',
                            bg: 'bg-muted',
                            label: 'activity',
                        };
                        const Icon = config.icon;
                        const isLast = index === activities.length - 1;

                        return (
                            <div key={activity.id} className="relative">
                                <div className="flex gap-3 py-3">
                                    {/* Timeline indicator */}
                                    <div className="relative flex flex-col items-center">
                                        <div
                                            className={cn(
                                                'flex items-center justify-center w-8 h-8 rounded-full shrink-0',
                                                config.bg,
                                                config.color
                                            )}
                                        >
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        {!isLast && (
                                            <div className="w-px h-full bg-border absolute top-8" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm text-foreground leading-relaxed">
                                                {getActivityMessage(activity)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(activity.createdAt), {
                                                    addSuffix: true,
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}
