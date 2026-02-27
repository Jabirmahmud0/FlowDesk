'use client';

import { useOrg } from '@/hooks/use-org';
import { useWorkspace } from '@/hooks/use-workspace';
import { Button } from '@/components/ui/button';
import { Plus, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type SortField = 'title' | 'status' | 'priority' | 'assignee';
type SortDirection = 'asc' | 'desc';

const PRIORITY_ORDER: Record<string, number> = {
    URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1, NONE: 0,
};

const STATUS_ORDER: Record<string, number> = {
    TODO: 0, IN_PROGRESS: 1, IN_REVIEW: 2, DONE: 3,
};

// ─── Inline Editable Title ─────────────────────────────────────────
function InlineTitle({
    value,
    onSave,
}: {
    value: string;
    onSave: (newTitle: string) => void;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editing) inputRef.current?.focus();
    }, [editing]);

    useEffect(() => {
        setDraft(value);
    }, [value]);

    const commit = useCallback(() => {
        const trimmed = draft.trim();
        if (trimmed && trimmed !== value) {
            onSave(trimmed);
        } else {
            setDraft(value);
        }
        setEditing(false);
    }, [draft, value, onSave]);

    if (editing) {
        return (
            <input
                ref={inputRef}
                className="w-full bg-transparent border border-primary/40 rounded px-1.5 py-0.5 text-sm font-medium outline-none focus:ring-1 focus:ring-primary/50"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') commit();
                    if (e.key === 'Escape') {
                        setDraft(value);
                        setEditing(false);
                    }
                }}
                onClick={(e) => e.stopPropagation()}
            />
        );
    }

    return (
        <span
            className="font-medium truncate cursor-text hover:bg-muted/80 rounded px-1.5 py-0.5 -mx-1.5 transition-colors"
            onDoubleClick={(e) => {
                e.stopPropagation();
                setEditing(true);
            }}
            title="Double-click to edit"
        >
            {value}
        </span>
    );
}

// ─── Inline Status Dropdown ────────────────────────────────────────
function InlineStatus({
    value,
    onSave,
}: {
    value: string;
    onSave: (newStatus: string) => void;
}) {
    return (
        <Select
            value={value}
            onValueChange={(v) => {
                if (v !== value) onSave(v);
            }}
        >
            <SelectTrigger
                className={cn(
                    'h-7 text-xs border-none shadow-none px-2 w-auto min-w-0 gap-1',
                    value === 'DONE' && 'text-green-500',
                    value === 'IN_PROGRESS' && 'text-blue-500',
                    value === 'IN_REVIEW' && 'text-amber-500',
                    value === 'TODO' && 'text-slate-500',
                )}
                onClick={(e) => e.stopPropagation()}
            >
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="TODO">Todo</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="IN_REVIEW">In Review</SelectItem>
                <SelectItem value="DONE">Done</SelectItem>
            </SelectContent>
        </Select>
    );
}

// ─── Inline Priority Dropdown ──────────────────────────────────────
function InlinePriority({
    value,
    onSave,
}: {
    value: string;
    onSave: (newPriority: string) => void;
}) {
    return (
        <Select
            value={value}
            onValueChange={(v) => {
                if (v !== value) onSave(v);
            }}
        >
            <SelectTrigger
                className={cn(
                    'h-7 text-xs border-none shadow-none px-2 w-auto min-w-0 gap-1',
                    value === 'URGENT' && 'text-red-500',
                    value === 'HIGH' && 'text-orange-500',
                    value === 'MEDIUM' && 'text-yellow-600',
                    value === 'LOW' && 'text-blue-500',
                )}
                onClick={(e) => e.stopPropagation()}
            >
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
        </Select>
    );
}

// ─── Sort Header ───────────────────────────────────────────────────
function SortHeader({
    label,
    field,
    currentField,
    currentDir,
    onSort,
    className,
}: {
    label: string;
    field: SortField;
    currentField: SortField | null;
    currentDir: SortDirection;
    onSort: (field: SortField) => void;
    className?: string;
}) {
    const active = currentField === field;
    return (
        <button
            className={cn(
                'flex items-center gap-1 text-sm font-medium hover:text-foreground transition-colors select-none',
                active ? 'text-foreground' : 'text-muted-foreground',
                className,
            )}
            onClick={() => onSort(field)}
        >
            {label}
            {active ? (
                currentDir === 'asc' ? (
                    <ArrowUp className="h-3.5 w-3.5" />
                ) : (
                    <ArrowDown className="h-3.5 w-3.5" />
                )
            ) : (
                <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
            )}
        </button>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────
export default function BacklogPage() {
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
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    // Sort states
    const [sortField, setSortField] = useState<SortField | null>(null);
    const [sortDir, setSortDir] = useState<SortDirection>('asc');

    const firstProjectId = workspace?.projects[0]?.id;
    const utils = trpc.useUtils();

    const { data: tasks } = trpc.task.listByProject.useQuery(
        { projectId: firstProjectId!, orgId: org?.id! },
        { enabled: !!firstProjectId && !!org?.id }
    );

    const updateTask = trpc.task.update.useMutation({
        onSuccess: () => {
            utils.task.listByProject.invalidate();
        },
    });

    // Filter + sort logic
    const processedTasks = useMemo(() => {
        let result = tasks?.filter((task: any) => {
            const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;
            const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
            return matchesSearch && matchesPriority && matchesStatus;
        }) || [];

        if (sortField) {
            result = [...result].sort((a: any, b: any) => {
                let cmp = 0;
                switch (sortField) {
                    case 'title':
                        cmp = (a.title || '').localeCompare(b.title || '');
                        break;
                    case 'status':
                        cmp = (STATUS_ORDER[a.status] ?? 0) - (STATUS_ORDER[b.status] ?? 0);
                        break;
                    case 'priority':
                        cmp = (PRIORITY_ORDER[a.priority] ?? 0) - (PRIORITY_ORDER[b.priority] ?? 0);
                        break;
                    case 'assignee': {
                        const nameA = a.assignee?.name || a.assignee?.email || '';
                        const nameB = b.assignee?.name || b.assignee?.email || '';
                        cmp = nameA.localeCompare(nameB);
                        break;
                    }
                }
                return sortDir === 'desc' ? -cmp : cmp;
            });
        }

        return result;
    }, [tasks, searchQuery, priorityFilter, statusFilter, sortField, sortDir]);

    const handleSort = useCallback((field: SortField) => {
        if (sortField === field) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortDir('asc');
        }
    }, [sortField]);

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

    const handleInlineUpdate = useCallback(
        (taskId: string, data: Record<string, any>) => {
            updateTask.mutate({ id: taskId, ...data });
        },
        [updateTask]
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
        <div className="flex flex-col h-full p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Backlog</h1>
                    <p className="text-muted-foreground text-sm">
                        Manage tasks for {workspace.projects[0].name}
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
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                    />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Statuses</SelectItem>
                        <SelectItem value="TODO">Todo</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="IN_REVIEW">In Review</SelectItem>
                        <SelectItem value="DONE">Done</SelectItem>
                    </SelectContent>
                </Select>

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

                {(searchQuery || priorityFilter !== 'ALL' || statusFilter !== 'ALL') && (
                    <Button
                        variant="ghost"
                        onClick={() => {
                            setSearchQuery('');
                            setPriorityFilter('ALL');
                            setStatusFilter('ALL');
                        }}
                    >
                        Reset
                    </Button>
                )}
            </div>

            {/* List View */}
            <div className="border rounded-md overflow-hidden">
                {/* Sortable Header */}
                <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/50">
                    <div className="col-span-5">
                        <SortHeader label="Title" field="title" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
                    </div>
                    <div className="col-span-2">
                        <SortHeader label="Status" field="status" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
                    </div>
                    <div className="col-span-2">
                        <SortHeader label="Priority" field="priority" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
                    </div>
                    <div className="col-span-3">
                        <SortHeader label="Assignee" field="assignee" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
                    </div>
                </div>

                {/* Rows */}
                <div className="divide-y">
                    {processedTasks.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            No tasks found
                        </div>
                    ) : (
                        processedTasks.map((task: any) => (
                            <div
                                key={task.id}
                                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/50 cursor-pointer transition-colors group"
                                onClick={() => handleTaskClick(task)}
                            >
                                <div className="col-span-5 min-w-0">
                                    <InlineTitle
                                        value={task.title}
                                        onSave={(newTitle) => handleInlineUpdate(task.id, { title: newTitle })}
                                    />
                                </div>
                                <div className="col-span-2" onClick={(e) => e.stopPropagation()}>
                                    <InlineStatus
                                        value={task.status}
                                        onSave={(newStatus) => handleInlineUpdate(task.id, { status: newStatus })}
                                    />
                                </div>
                                <div className="col-span-2" onClick={(e) => e.stopPropagation()}>
                                    <InlinePriority
                                        value={task.priority}
                                        onSave={(newPriority) => handleInlineUpdate(task.id, { priority: newPriority })}
                                    />
                                </div>
                                <div className="col-span-3 flex items-center gap-2">
                                    {task.assignee ? (
                                        <>
                                            <Avatar className="h-6 w-6">
                                                <AvatarFallback className="text-[10px]">
                                                    {task.assignee.name?.[0] || task.assignee.email[0].toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm text-muted-foreground truncate">
                                                {task.assignee.name || task.assignee.email.split('@')[0]}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-sm text-muted-foreground italic">Unassigned</span>
                                    )}
                                </div>
                            </div>
                        ))
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
        </div>
    );
}
