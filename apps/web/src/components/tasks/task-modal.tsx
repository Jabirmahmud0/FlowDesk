'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTaskSchema, updateTaskSchema } from '@flowdesk/types';
import { z } from 'zod';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { useWorkspace } from '@/hooks/use-workspace';
import { useOrg } from '@/hooks/use-org';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    task?: any; // Uses inferred type usually, but 'any' for speed here (TODO: improve typing)
    projectId: string;
};

// Extending schema for form usage if needed, or using as is
// createTaskSchema expects { title, description?, status?, priority?, assigneeId?, dueDate?, projectId, orgId (added by server) }

export function TaskModal({ open, onOpenChange, task, projectId }: Props) {
    const { workspace } = useWorkspace();
    const utils = trpc.useUtils();

    const form = useForm({
        resolver: zodResolver(createTaskSchema.omit({ orgId: true })),
        defaultValues: {
            projectId,
            title: task?.title || '',
            description: task?.description || '',
            status: task?.status || 'TODO',
            priority: task?.priority || 'MEDIUM',
            assigneeId: task?.assigneeId || null,
        },
    });

    const createMutation = trpc.task.create.useMutation({
        onSuccess: () => {
            utils.task.listByProject.invalidate();
            onOpenChange(false);
            form.reset();
        },
    });

    const updateMutation = trpc.task.update.useMutation({
        onSuccess: () => {
            utils.task.listByProject.invalidate();
            onOpenChange(false);
        },
    });

    const isEditing = !!task;

    const onSubmit = (data: any) => {
        if (isEditing) {
            updateMutation.mutate({ id: task.id, ...data });
        } else {
            createMutation.mutate({ ...data, projectId });
        }
    };

    const { org } = useOrg();

    // Logic to get members. We'll use org members for now.
    const projectMembers = org?.members || [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Task' : 'Create Task'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" {...form.register('title')} placeholder="Task title" />
                        {form.formState.errors.title && (
                            <p className="text-sm text-destructive">{form.formState.errors.title.message as string}</p>
                        )}
                    </div>

                    {/* ADD ASSIGNEE SELECTOR */}
                    <div className="space-y-2">
                        <Label htmlFor="assigneeId">Assignee</Label>
                        <Select
                            onValueChange={(val) => form.setValue('assigneeId', val)}
                            defaultValue={form.getValues('assigneeId') || undefined}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Unassigned" />
                            </SelectTrigger>
                            <SelectContent>
                                {projectMembers.map((member: any) => (
                                    <SelectItem key={member.userId} value={member.userId}>
                                        {member.user.name || member.user.email}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                            onValueChange={(val) => form.setValue('status', val as any)}
                            defaultValue={form.getValues('status') || 'TODO'}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TODO">To Do</SelectItem>
                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                <SelectItem value="IN_REVIEW">In Review</SelectItem>
                                <SelectItem value="DONE">Done</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select
                            onValueChange={(val) => form.setValue('priority', val as any)}
                            defaultValue={form.getValues('priority') || 'MEDIUM'}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="LOW">Low</SelectItem>
                                <SelectItem value="MEDIUM">Medium</SelectItem>
                                <SelectItem value="HIGH">High</SelectItem>
                                <SelectItem value="URGENT">Urgent</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" {...form.register('description')} placeholder="Add details..." />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Task'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
