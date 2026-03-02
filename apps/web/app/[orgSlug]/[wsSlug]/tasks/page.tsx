'use client';

import { useOrg } from '@/hooks/use-org';
import { useWorkspace } from '@/hooks/use-workspace';
import { trpc } from '@/lib/trpc';
import { TaskListView } from '@/components/task/list-view';
import { Button } from '@/components/ui/button';
import { Plus, List, LayoutGrid } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { BoardView } from '@/components/kanban/board';

export default function TasksPage() {
    const { org } = useOrg();
    const { workspace } = useWorkspace();
    const router = useRouter();
    const [view, setView] = useState<'list' | 'board'>('board');

    const { data: tasks, isLoading } = trpc.task.listByProject.useQuery(
        { orgId: org?.id!, projectId: workspace?.id! },
        { enabled: !!org?.id && !!workspace?.id }
    );

    const { data: labels } = trpc.task.labelsByOrg.useQuery(
        { orgId: org?.id! },
        { enabled: !!org?.id }
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-muted-foreground">Loading tasks...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
                    <p className="text-muted-foreground text-sm">
                        Manage and track all tasks in your workspace.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center border rounded-md p-1">
                        <Button
                            variant={view === 'list' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setView('list')}
                            className="gap-1"
                        >
                            <List className="h-4 w-4" />
                            List
                        </Button>
                        <Button
                            variant={view === 'board' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setView('board')}
                            className="gap-1"
                        >
                            <LayoutGrid className="h-4 w-4" />
                            Board
                        </Button>
                    </div>
                    <Button onClick={() => router.push(`/${org?.slug}/${workspace?.slug}/tasks/new`)}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Task
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
                {view === 'list' ? (
                    <TaskListView
                        tasks={tasks || []}
                        orgId={org?.id!}
                        onSelectionChange={(ids) => console.log('Selected:', ids)}
                        onTaskUpdate={(task) => router.push(`/${org?.slug}/${workspace?.slug}/tasks/${task.id}`)}
                    />
                ) : (
                    <BoardView
                        tasks={tasks || []}
                        labels={labels || []}
                        orgId={org?.id!}
                        projectId={workspace?.id!}
                    />
                )}
            </div>
        </div>
    );
}
