'use client';

import { useState } from 'react';
import { useOrg } from '@/hooks/use-org';
import { useWorkspace } from '@/hooks/use-workspace';
import { trpc } from '@/lib/trpc';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Pencil, Trash2, Check, X } from 'lucide-react';
import { TaskModal } from '@/components/tasks/task-modal';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
    TODO: 'bg-slate-500',
    IN_PROGRESS: 'bg-blue-500',
    IN_REVIEW: 'bg-amber-500',
    DONE: 'bg-emerald-500',
};

const PRIORITY_COLORS: Record<string, string> = {
    URGENT: 'text-red-500',
    HIGH: 'text-orange-500',
    MEDIUM: 'text-yellow-500',
    LOW: 'text-blue-500',
    NONE: 'text-muted-foreground',
};

export default function BacklogPage() {
    const { org } = useOrg();
    const { workspace } = useWorkspace();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<any | null>(null);
    const [inlineEdit, setInlineEdit] = useState<{ id: string; field: string; value: string } | null>(null);

    const firstProjectId = workspace?.projects[0]?.id;

    const { data: tasks, isLoading, error } = trpc.task.listByProject.useQuery(
        { projectId: firstProjectId!, orgId: org?.id! },
        { 
            enabled: !!firstProjectId && !!org?.id,
            retry: 2,
        }
    );

    const updateTask = trpc.task.update.useMutation({
        onSuccess: () => {
            utils.task.listByProject.invalidate({ projectId: firstProjectId });
            setInlineEdit(null);
        },
    });

    const deleteTask = trpc.task.delete.useMutation({
        onSuccess: () => {
            utils.task.listByProject.invalidate({ projectId: firstProjectId });
        },
    });

    const utils = trpc.useUtils();

    // Handle errors
    if (error) {
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
                        {error.message || 'Something went wrong. Please try again.'}
                    </p>
                    <Button onClick={() => window.location.reload()} className="w-full">
                        Reload Page
                    </Button>
                </Card>
            </div>
        );
    }

    const handleInlineEdit = (taskId: string, field: string, value: string) => {
        const task = tasks?.find((t: any) => t.id === taskId);
        if (!task) return;

        updateTask.mutate({
            id: taskId,
            orgId: org!.id,
            [field]: value,
        });
    };

    if (!firstProjectId) {
        return (
            <div className="flex items-center justify-center h-full">
                <Card className="p-8 text-center max-w-md">
                    <h2 className="text-xl font-semibold mb-2">No project selected</h2>
                    <p className="text-muted-foreground">Select a project to view the backlog.</p>
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
                            <h1 className="text-2xl font-bold tracking-tight">Backlog</h1>
                            <p className="text-sm text-muted-foreground">
                                Manage and prioritize all tasks
                            </p>
                        </div>
                        <Button onClick={() => setIsModalOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            New Task
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[400px]">Task</TableHead>
                                    <TableHead className="w-[120px]">Status</TableHead>
                                    <TableHead className="w-[100px]">Priority</TableHead>
                                    <TableHead className="w-[150px]">Assignee</TableHead>
                                    <TableHead className="w-[120px]">Due Date</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            Loading tasks...
                                        </TableCell>
                                    </TableRow>
                                ) : tasks?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No tasks yet. Create one to get started.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    tasks?.map((task: any) => (
                                        <TableRow key={task.id} className="group hover:bg-muted/50">
                                            <TableCell>
                                                {inlineEdit?.id === task.id && inlineEdit?.field === 'title' ? (
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            defaultValue={task.title}
                                                            className="h-8"
                                                            autoFocus
                                                            onBlur={(e) => handleInlineEdit(task.id, 'title', e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    handleInlineEdit(task.id, 'title', e.currentTarget.value);
                                                                } else if (e.key === 'Escape') {
                                                                    setInlineEdit(null);
                                                                }
                                                            }}
                                                        />
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8"
                                                            onClick={() => handleInlineEdit(task.id, 'title', (e.target as HTMLInputElement).value)}
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8"
                                                            onClick={() => setInlineEdit(null)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div
                                                        className="cursor-pointer hover:text-primary transition-colors"
                                                        onClick={() => setInlineEdit({ id: task.id, field: 'title', value: task.title })}
                                                    >
                                                        {task.title}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    defaultValue={task.status}
                                                    onValueChange={(value) =>
                                                        updateTask.mutate({
                                                            id: task.id,
                                                            orgId: org!.id,
                                                            status: value as any,
                                                        })
                                                    }
                                                >
                                                    <SelectTrigger className="h-8 w-[110px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="TODO">To Do</SelectItem>
                                                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                                        <SelectItem value="IN_REVIEW">In Review</SelectItem>
                                                        <SelectItem value="DONE">Done</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    defaultValue={task.priority}
                                                    onValueChange={(value) =>
                                                        updateTask.mutate({
                                                            id: task.id,
                                                            orgId: org!.id,
                                                            priority: value as any,
                                                        })
                                                    }
                                                >
                                                    <SelectTrigger className={cn('h-8 w-[90px]', PRIORITY_COLORS[task.priority])}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="URGENT">🔴 Urgent</SelectItem>
                                                        <SelectItem value="HIGH">🟠 High</SelectItem>
                                                        <SelectItem value="MEDIUM">🟡 Medium</SelectItem>
                                                        <SelectItem value="LOW">🟢 Low</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {task.assignee ? (
                                                        <>
                                                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                                                                {task.assignee.name?.charAt(0).toUpperCase()}
                                                            </div>
                                                            <span className="text-sm">{task.assignee.name}</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">Unassigned</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="date"
                                                    defaultValue={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                                                    className="h-8 w-[110px]"
                                                    onChange={(e) =>
                                                        updateTask.mutate({
                                                            id: task.id,
                                                            orgId: org!.id,
                                                            dueDate: e.target.value || null,
                                                        })
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={(e) => {
                                                            e.preventDefault();
                                                            setEditingTask(task);
                                                            setIsModalOpen(true);
                                                        }}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                deleteTask.mutate({ id: task.id });
                                                            }}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <TaskModal
                open={isModalOpen}
                onOpenChange={(open) => {
                    setIsModalOpen(open);
                    if (!open) setEditingTask(null);
                }}
                projectId={firstProjectId}
                task={editingTask}
            />
        </div>
    );
}
