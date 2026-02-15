'use client';

import { useOrg } from '@/hooks/use-org';
import { useWorkspace } from '@/hooks/use-workspace';
import { KanbanBoard } from '@/components/kanban/board';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { TaskModal } from '@/components/tasks/task-modal';
import { trpc } from '@/lib/trpc';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { TaskDetailPanel } from '@/components/tasks/task-detail-panel';

export default function BoardPage() {
    const { org } = useOrg();
    const { workspace, isLoading } = useWorkspace();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // View/Edit state
    const [viewingTask, setViewingTask] = useState<any | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<any | null>(null);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
    const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL');

    const firstProjectId = workspace?.projects[0]?.id;

    const { data: tasks } = trpc.task.listByProject.useQuery(
        { projectId: firstProjectId!, orgId: org?.id! },
        { enabled: !!firstProjectId && !!org?.id }
    );

    const projectMembers = org?.members || [];

    // Filter logic
    const filteredTasks = tasks?.filter((task: any) => {
        const titleMatch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
        const descMatch = typeof task.description === 'string'
            ? task.description.toLowerCase().includes(searchQuery.toLowerCase())
            : false;
        const matchesSearch = titleMatch || descMatch;

        const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;

        // Note: Assignee filtering depends on task having assigneeId or assignee object.
        // Assuming task has assigneeId for now.
        const matchesAssignee = assigneeFilter === 'ALL' || task.assigneeId === assigneeFilter;

        return matchesSearch && matchesPriority && matchesAssignee;
    }) || [];

    const handleTaskClick = (task: any) => {
        setViewingTask(task);
        setIsDetailOpen(true);
    };

    const handleEditTask = (task: any) => {
        setEditingTask(task);
        setIsModalOpen(true);
        // Optionally close detail panel, or keep it open and update on modal close
        // setIsDetailOpen(false); 
    };

    const handleModalClose = (open: boolean) => {
        setIsModalOpen(open);
        if (!open) setEditingTask(null);
    };

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
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center justify-between">
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

                {/* Filters */}
                <div className="flex items-center gap-2">
                    <div className="relative w-64">
                        {/* <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /> */}
                        <Input
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full"
                        />
                    </div>

                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Priorities</SelectItem>
                            <SelectItem value="LOW">Low</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="HIGH">High</SelectItem>
                            <SelectItem value="URGENT">Urgent</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Assignee" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Assignees</SelectItem>
                            <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                            {projectMembers.map((member: any) => (
                                <SelectItem key={member.userId} value={member.userId}>
                                    {member.user.name || member.user.email}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {(searchQuery || priorityFilter !== 'ALL' || assigneeFilter !== 'ALL') && (
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setSearchQuery('');
                                setPriorityFilter('ALL');
                                setAssigneeFilter('ALL');
                            }}
                        >
                            Reset
                        </Button>
                    )}
                </div>
            </div>

            <TaskModal
                open={isModalOpen}
                onOpenChange={handleModalClose}
                projectId={firstProjectId}
                task={editingTask}
            />

            <TaskDetailPanel
                open={isDetailOpen}
                onOpenChange={setIsDetailOpen}
                task={viewingTask}
                onEdit={handleEditTask}
            />

            <div className="flex-1 overflow-hidden">
                {tasks ? (
                    <KanbanBoard
                        projectId={firstProjectId}
                        initialTasks={filteredTasks as any}
                        onTaskClick={handleTaskClick}
                    />
                ) : (
                    <div>Loading tasks...</div>
                )}
            </div>
        </div>
    );
}
