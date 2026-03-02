'use client';

import { useOrg } from '@/hooks/use-org';
import { useWorkspace } from '@/hooks/use-workspace';
import { KanbanBoard } from '@/components/kanban/board';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter, X, FolderKanban } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

import { TaskDetailPanel } from '@/components/tasks/task-detail-panel';
import { CreateProjectDialog } from '@/components/projects/create-project-dialog';

export default function BoardPage() {
    const { org } = useOrg();
    const { workspace, isLoading: wsLoading, error: wsError } = useWorkspace();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);

    // View/Edit state
    const [viewingTask, setViewingTask] = useState<any | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<any | null>(null);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
    const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL');

    const firstProjectId = workspace?.projects[0]?.id;

    const { data: tasks, isLoading: tasksLoading, error: tasksError } = trpc.task.listByProject.useQuery(
        { projectId: firstProjectId!, orgId: org?.id! },
        {
            enabled: !!firstProjectId && !!org?.id && !!workspace,
            retry: 2,
            staleTime: 1000 * 60 * 5, // 5 minutes
        }
    );

    const projectMembers = org?.members || [];

    // Debug logging
    if (typeof window !== 'undefined') {
        console.log('[Board Page] workspace:', workspace?.id, 'firstProjectId:', firstProjectId, 'tasks:', tasks?.length, 'wsLoading:', wsLoading, 'tasksLoading:', tasksLoading);
    }

    // Filter logic
    const filteredTasks = tasks?.filter((task: any) => {
        const titleMatch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSearch = titleMatch;
        const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;
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
    };

    const handleModalClose = (open: boolean) => {
        setIsModalOpen(open);
        if (!open) setEditingTask(null);
    };

    const hasActiveFilters = searchQuery || priorityFilter !== 'ALL' || assigneeFilter !== 'ALL';

    // Handle errors
    if (wsError || tasksError) {
        return (
            <div className="flex items-center justify-center h-full">
                <Card className="p-8 text-center max-w-md">
                    <div className="mb-4">
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                            <X className="h-8 w-8 text-red-500" />
                        </div>
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Failed to load</h2>
                    <p className="text-muted-foreground mb-6">
                        {wsError?.message || tasksError?.message || 'Something went wrong. Please try again.'}
                    </p>
                    <Button
                        onClick={() => {
                            window.location.reload();
                        }}
                        className="w-full"
                    >
                        Reload Page
                    </Button>
                </Card>
            </div>
        );
    }

    // Still loading critical data
    if (wsLoading || (firstProjectId && (tasksLoading || !tasks))) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Loading board...</p>
                </div>
            </div>
        );
    }

    if (!workspace) {
        return (
            <div className="flex items-center justify-center h-full">
                <Card className="p-8 text-center max-w-md">
                    <div className="mb-4">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                            <FolderKanban className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </div>
                    <h2 className="text-xl font-semibold mb-2">No workspace selected</h2>
                    <p className="text-muted-foreground mb-6">
                        Please select a workspace from the sidebar to view the board.
                    </p>
                </Card>
            </div>
        );
    }

    if (!firstProjectId) {
        return (
            <div className="flex items-center justify-center h-full">
                <Card className="p-8 text-center max-w-md">
                    <div className="mb-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                            <Plus className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
                    <p className="text-muted-foreground mb-6">
                        Create your first project to start managing tasks with the Kanban board.
                    </p>
                    <Button onClick={() => setIsCreateProjectOpen(true)} className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Project
                    </Button>
                    <CreateProjectDialog open={isCreateProjectOpen} onOpenChange={setIsCreateProjectOpen} />
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-background to-muted/20">
            {/* Header */}
            <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container py-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight">Board</h1>
                                <Badge variant="secondary" className="text-xs">
                                    {workspace.projects[0].name}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Drag and drop tasks to manage your workflow
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => setIsCreateProjectOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                New Project
                            </Button>
                            <Button onClick={() => setIsModalOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                New Task
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="border-b bg-muted/30">
                <div className="container py-3">
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search tasks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9"
                            />
                        </div>

                        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                            <SelectTrigger className="w-[130px] h-9">
                                <Filter className="mr-2 h-3 w-3" />
                                <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Priorities</SelectItem>
                                <SelectItem value="URGENT">🔴 Urgent</SelectItem>
                                <SelectItem value="HIGH">🟠 High</SelectItem>
                                <SelectItem value="MEDIUM">🟡 Medium</SelectItem>
                                <SelectItem value="LOW">🟢 Low</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                            <SelectTrigger className="w-[140px] h-9">
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

                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSearchQuery('');
                                    setPriorityFilter('ALL');
                                    setAssigneeFilter('ALL');
                                }}
                                className="h-9"
                            >
                                <X className="mr-2 h-3 w-3" />
                                Reset
                            </Button>
                        )}

                        <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{filteredTasks.length} tasks</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Board Content */}
            <div className="flex-1 overflow-hidden p-6">
                <KanbanBoard
                    projectId={firstProjectId}
                    orgId={org?.id || ''}
                    initialTasks={filteredTasks as any}
                    onTaskClick={handleTaskClick}
                />
            </div>

            {/* Dialogs */}
            <CreateProjectDialog open={isCreateProjectOpen} onOpenChange={setIsCreateProjectOpen} />

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
        </div>
    );
}
