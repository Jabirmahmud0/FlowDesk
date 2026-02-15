'use client';

import { useOrg } from '@/hooks/use-org';
import { useWorkspace } from '@/hooks/use-workspace';
import { KanbanBoard } from '@/components/kanban/board';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { TaskModal } from '@/components/tasks/task-modal';
import { trpc } from '@/lib/trpc';
import { useOrg } from '@/hooks/use-org';

export default function BoardPage() {
    const { org } = useOrg(); // Need org context for orgId
    const { workspace, isLoading } = useWorkspace();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // We need to pick a project to show the board for.
    // For now, let's default to the first project or show a selector if we had one.
    // Assuming the route layout might change to `/[org]/[ws]/priority` or `/[org]/[ws]/[project]`.
    // The current route is `/[org]/[ws]/board`.
    // Let's assume we show "All Tasks" or prompt to select a project.
    // To keep it simple for this phase, let's just use the first project if available.

    const firstProjectId = workspace?.projects[0]?.id;

    const { data: tasks } = trpc.task.listByProject.useQuery(
        { projectId: firstProjectId!, orgId: org?.id! },
        { enabled: !!firstProjectId && !!org?.id }
    );

    if (isLoading) return <div className="p-8">Loading...</div>;
    if (!workspace) return <div className="p-8">Workspace not found</div>;
    if (!firstProjectId) return (
        <div className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">No projects found</h2>
            <p className="text-muted-foreground">Create a project to start adding tasks.</p>
        </div>
    );

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Board</h1>
                    <p className="text-muted-foreground text-sm">
                        Project: {workspace.projects[0].name}
                    </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Task
                </Button>
            </div>

            <TaskModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                projectId={firstProjectId}
            />

            <div className="flex-1 overflow-hidden">
                {tasks ? (
                    <KanbanBoard projectId={firstProjectId} initialTasks={tasks as any} />
                ) : (
                    <div>Loading tasks...</div>
                )}
            </div>
        </div>
    );
}
