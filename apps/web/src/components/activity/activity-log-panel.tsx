'use client';

import { trpc } from '@/lib/trpc';
import { ActivityFeed } from './activity-feed';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

type ActivityLogPanelProps = {
    orgId: string;
    taskId?: string;
    projectId?: string;
    documentId?: string;
    onClose?: () => void;
};

export function ActivityLogPanel({
    orgId,
    taskId,
    projectId,
    documentId,
    onClose,
}: ActivityLogPanelProps) {
    const { data: activities, isLoading, refetch } = trpc.activity.list.useQuery(
        {
            orgId,
            taskId,
            projectId,
            documentId,
            limit: 50,
        },
        {
            enabled: !!(orgId && (taskId || projectId || documentId)),
            refetchInterval: 30000, // Refresh every 30 seconds
        }
    );

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <div>
                    <h3 className="font-semibold">Activity Log</h3>
                    <p className="text-xs text-muted-foreground">
                        Recent activity for this {taskId ? 'task' : projectId ? 'project' : documentId ? 'document' : 'item'}
                    </p>
                </div>
                {onClose && (
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Activity Feed */}
            {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Loading activity...</p>
                    </div>
                </div>
            ) : (
                <ActivityFeed
                    activities={(activities || []) as any}
                    showHeader={false}
                />
            )}
        </div>
    );
}
