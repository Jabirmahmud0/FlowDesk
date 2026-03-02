'use client';

import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import {
    CheckSquare, MessageSquare, FileText, UserPlus,
    Plus, Pencil, Trash2, Activity
} from 'lucide-react';

const ACTION_ICONS: Record<string, any> = {
    TASK_CREATED: Plus,
    TASK_UPDATED: Pencil,
    TASK_DELETED: Trash2,
    TASK_COMPLETED: CheckSquare,
    COMMENT_ADDED: MessageSquare,
    COMMENT_DELETED: Trash2,
    DOCUMENT_CREATED: FileText,
    DOCUMENT_UPDATED: Pencil,
    MEMBER_INVITED: UserPlus,
};

const ACTION_LABELS: Record<string, string> = {
    TASK_CREATED: 'created a task',
    TASK_UPDATED: 'updated a task',
    TASK_DELETED: 'deleted a task',
    TASK_COMPLETED: 'completed a task',
    TASK_MOVED: 'moved a task',
    COMMENT_ADDED: 'added a comment',
    COMMENT_DELETED: 'deleted a comment',
    DOCUMENT_CREATED: 'created a doc',
    DOCUMENT_UPDATED: 'updated a doc',
    MEMBER_INVITED: 'invited a member',
};

const ACTION_COLORS: Record<string, string> = {
    TASK_CREATED: 'text-blue-500 bg-blue-500/10',
    TASK_COMPLETED: 'text-emerald-500 bg-emerald-500/10',
    TASK_DELETED: 'text-red-500 bg-red-500/10',
    COMMENT_ADDED: 'text-purple-500 bg-purple-500/10',
    DOCUMENT_CREATED: 'text-orange-500 bg-orange-500/10',
    DOCUMENT_UPDATED: 'text-orange-400 bg-orange-400/10',
    MEMBER_INVITED: 'text-pink-500 bg-pink-500/10',
};

interface RecentActivityProps {
    orgId: string;
}

export function RecentActivity({ orgId }: RecentActivityProps) {
    const { data: activities } = trpc.activity.list.useQuery({
        orgId,
        limit: 8,
    }, {
        staleTime: 3 * 60 * 1000, // 3 minutes
        refetchOnWindowFocus: false,
    });

    return (
        <Card className="h-full border border-border/50">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        Recent Activity
                    </CardTitle>
                    {activities && activities.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                            {activities.length} events
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                {!activities || activities.length === 0 ? (
                    <div className="text-center py-8">
                        <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">No activity yet.</p>
                        <p className="text-xs text-muted-foreground mt-1">Actions will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {activities.map((act: any) => {
                            const IconComp = ACTION_ICONS[act.action] || Activity;
                            const colorClass = ACTION_COLORS[act.action] || 'text-muted-foreground bg-muted';
                            const label = ACTION_LABELS[act.action] || act.action.toLowerCase().replace(/_/g, ' ');

                            return (
                                <div
                                    key={act.id}
                                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                                >
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                                        <IconComp className="h-3.5 w-3.5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs leading-snug">
                                            <span className="font-semibold">
                                                {act.user?.name || act.user?.email || 'Someone'}
                                            </span>{' '}
                                            <span className="text-muted-foreground">{label}</span>
                                            {(act.task?.title || act.document?.title) && (
                                                <span className="font-medium">
                                                    {' '}"{act.task?.title || act.document?.title}"
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                            {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
                                            {act.project?.name && (
                                                <> · {act.project.name}</>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
