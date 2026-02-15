'use client';

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
// import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit, Trash2, Calendar, User } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useWorkspace } from '@/hooks/use-workspace';

import { useOrg } from '@/hooks/use-org';
import { CommentSection } from './comment-section';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    task: any | null;
    onEdit: (task: any) => void;
};

const priorityColors = {
    LOW: 'bg-slate-500',
    MEDIUM: 'bg-blue-500',
    HIGH: 'bg-orange-500',
    URGENT: 'bg-red-500',
};

export function TaskDetailPanel({ open, onOpenChange, task, onEdit }: Props) {
    const { org } = useOrg();
    const utils = trpc.useUtils();

    // In a real app, we might fetch fresh task details here if the prop is partial.
    // For now, assume task prop has what we need.

    // const deleteTaskMutation = trpc.task.delete.useMutation({ ... }); // TODO: Implement delete

    if (!task) return null;

    const assignee = org?.members.find((m: any) => m.userId === task.assigneeId)?.user;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl w-[90vw] overflow-y-auto">
                <SheetHeader className="mb-6">
                    <div className="flex items-start justify-between gap-4">
                        <SheetTitle className="text-xl font-bold">{task.title}</SheetTitle>
                        <Button variant="outline" size="sm" onClick={() => onEdit(task)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                        </Button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                            {task.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className="text-xs border-transparent bg-muted">
                            <div className={`w-1.5 h-1.5 rounded-full mr-1 ${priorityColors[task.priority as keyof typeof priorityColors]}`} />
                            {task.priority}
                        </Badge>
                    </div>
                </SheetHeader>

                <div className="space-y-6">
                    {/* Description */}
                    <div>
                        <h4 className="text-sm font-medium mb-2 text-muted-foreground">Description</h4>
                        <div className="text-sm whitespace-pre-wrap">
                            {task.description || <span className="text-muted-foreground italic">No description provided.</span>}
                        </div>
                    </div>

                    <Separator />

                    {/* Meta */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h4 className="text-sm font-medium mb-2 text-muted-foreground flex items-center gap-2">
                                <User className="h-4 w-4" /> Assignee
                            </h4>
                            {assignee ? (
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={assignee.image || ''} />
                                        <AvatarFallback>{assignee.name?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">{assignee.name || assignee.email}</span>
                                </div>
                            ) : (
                                <span className="text-sm text-muted-foreground">Unassigned</span>
                            )}
                        </div>

                        <div>
                            <h4 className="text-sm font-medium mb-2 text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-4 w-4" /> Due Date
                            </h4>
                            <span className="text-sm">
                                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                            </span>
                        </div>
                    </div>

                    <Separator />

                    <CommentSection taskId={task.id} projectId={task.projectId} />
                </div>
            </SheetContent>
        </Sheet>
    );
}
