'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Flag, User, Link as LinkIcon, Trash2, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { EnhancedEditor } from '@/components/ui/enhanced-editor';

interface TaskDetail {
    id: string;
    title: string;
    description?: any;
    status: string;
    priority: string;
    assignee?: { id: string; name: string; avatarUrl?: string | null } | null;
    dueDate?: Date | null;
    projectId: string;
    orgId: string;
    labels?: { label: { id: string; name: string; color: string } }[];
    comments?: any[];
    attachments?: any[];
}

interface TaskDetailPanelProps {
    taskId: string | null;
    orgId: string;
    onClose: () => void;
}

export function TaskDetailPanel({ taskId, orgId, onClose }: TaskDetailPanelProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');
    const [editedDescription, setEditedDescription] = useState<any>(null);

    const { data: task, isLoading } = trpc.task.get.useQuery(
        { id: taskId! },
        { enabled: !!taskId }
    );

    const { data: comments } = trpc.comment.listByTask.useQuery(
        { orgId: orgId!, taskId: taskId! },
        { enabled: !!taskId && !!orgId }
    );

    const updateTask = trpc.task.update.useMutation({
        onSuccess: () => {
            setIsEditing(false);
        },
    });

    const deleteTask = trpc.task.delete.useMutation({
        onSuccess: () => {
            onClose();
        },
    });

    const createComment = trpc.comment.create.useMutation();

    useEffect(() => {
        if (task) {
            setEditedTitle(task.title);
            setEditedDescription(task.description);
        }
    }, [task]);

    const handleSave = () => {
        if (!task) return;
        updateTask.mutate({
            id: task.id,
            orgId: task.orgId,
            title: editedTitle,
            description: editedDescription,
        });
    };

    const handleStatusChange = (status: string) => {
        if (!task) return;
        updateTask.mutate({
            id: task.id,
            orgId: task.orgId,
            status: status as any,
        });
    };

    const handlePriorityChange = (priority: string) => {
        if (!task) return;
        updateTask.mutate({
            id: task.id,
            orgId: task.orgId,
            priority: priority as any,
        });
    };

    const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!task) return;
        updateTask.mutate({
            id: task.id,
            orgId: task.orgId,
            dueDate: e.target.value || null,
        });
    };

    const handleAddComment = (content: string) => {
        if (!task) return;
        createComment.mutate({
            orgId: task.orgId,
            taskId: task.id,
            content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: content }] }] },
        });
    };

    if (!taskId || !task) return null;

    const priorityColors: Record<string, string> = {
        URGENT: 'text-red-500 bg-red-500/10',
        HIGH: 'text-orange-500 bg-orange-500/10',
        MEDIUM: 'text-yellow-500 bg-yellow-500/10',
        LOW: 'text-blue-500 bg-blue-500/10',
        NONE: 'text-muted-foreground bg-muted',
    };

    const statusColors: Record<string, string> = {
        TODO: 'bg-secondary',
        IN_PROGRESS: 'bg-blue-500',
        IN_REVIEW: 'bg-yellow-500',
        DONE: 'bg-green-500',
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed right-0 top-0 h-full w-full max-w-2xl bg-background border-l shadow-2xl z-50 overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                        <Badge className={cn('text-white', statusColors[task.status] || 'bg-gray-500')}>
                            {task.status.replace(/_/g, ' ')}
                        </Badge>
                        <div className={cn('px-2 py-1 rounded text-xs font-medium', priorityColors[task.priority])}>
                            {task.priority}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteTask.mutate({ id: task.id })}
                            className="text-destructive hover:text-destructive"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="h-[calc(100%-140px)] overflow-y-auto p-4 space-y-6">
                    {/* Title */}
                    {isEditing ? (
                        <Input
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            className="text-xl font-semibold"
                            autoFocus
                        />
                    ) : (
                        <h2
                            className="text-xl font-semibold cursor-pointer hover:text-primary"
                            onClick={() => setIsEditing(true)}
                        >
                            {task.title}
                        </h2>
                    )}

                    {/* Properties Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Assignee */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-muted-foreground">
                                <User className="h-4 w-4" />
                                Assignee
                            </Label>
                            <div className="flex items-center gap-2">
                                {task.assignee ? (
                                    <>
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={task.assignee.avatarUrl || undefined} />
                                            <AvatarFallback>{task.assignee.name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm">{task.assignee.name}</span>
                                    </>
                                ) : (
                                    <span className="text-sm text-muted-foreground">Unassigned</span>
                                )}
                            </div>
                        </div>

                        {/* Due Date */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                Due Date
                            </Label>
                            <Input
                                type="date"
                                value={task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : ''}
                                onChange={handleDueDateChange}
                                className="text-sm"
                            />
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-muted-foreground">
                                <LinkIcon className="h-4 w-4" />
                                Status
                            </Label>
                            <Select value={task.status} onValueChange={handleStatusChange}>
                                <SelectTrigger className="text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TODO">To Do</SelectItem>
                                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                    <SelectItem value="IN_REVIEW">In Review</SelectItem>
                                    <SelectItem value="DONE">Done</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Priority */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-muted-foreground">
                                <Flag className="h-4 w-4" />
                                Priority
                            </Label>
                            <Select value={task.priority} onValueChange={handlePriorityChange}>
                                <SelectTrigger className="text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="URGENT">Urgent</SelectItem>
                                    <SelectItem value="HIGH">High</SelectItem>
                                    <SelectItem value="MEDIUM">Medium</SelectItem>
                                    <SelectItem value="LOW">Low</SelectItem>
                                    <SelectItem value="NONE">None</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Labels */}
                    {task.labels && task.labels.length > 0 && (
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-muted-foreground">
                                <Paperclip className="h-4 w-4" />
                                Labels
                            </Label>
                            <div className="flex flex-wrap gap-2">
                                {task.labels.map((tl) => (
                                    <Badge
                                        key={tl.label.id}
                                        style={{ backgroundColor: tl.label.color }}
                                        className="text-white"
                                    >
                                        {tl.label.name}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Description</Label>
                        <div className="border rounded-md min-h-[200px]">
                            <EnhancedEditor
                                value={editedDescription || ''}
                                onChange={setEditedDescription}
                                readOnly={!isEditing}
                            />
                        </div>
                    </div>

                    {/* Comments */}
                    <div className="space-y-4">
                        <Label className="text-muted-foreground">Comments ({comments?.length || 0})</Label>
                        <div className="space-y-3">
                            {comments?.map((comment: any) => (
                                <div key={comment.id} className="flex gap-3 p-3 border rounded-md">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={comment.user?.avatarUrl || undefined} />
                                        <AvatarFallback>{comment.user?.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm">{comment.user?.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {format(new Date(comment.createdAt), 'MMM d, yyyy')}
                                            </span>
                                        </div>
                                        <div className="text-sm mt-1">
                                            {comment.content?.content?.[0]?.content?.[0]?.text || 'No content'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <CommentForm onSubmit={handleAddComment} />
                    </div>

                    {/* Edit Actions */}
                    {isEditing && (
                        <div className="flex gap-2">
                            <Button onClick={handleSave} disabled={updateTask.isPending}>
                                Save Changes
                            </Button>
                            <Button variant="outline" onClick={() => setIsEditing(false)}>
                                Cancel
                            </Button>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40"
                onClick={onClose}
            />
        </AnimatePresence>
    );
}

function CommentForm({ onSubmit }: { onSubmit: (content: string) => void }) {
    const [content, setContent] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;
        onSubmit(content);
        setContent('');
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1"
            />
            <Button type="submit" size="sm">
                Comment
            </Button>
        </form>
    );
}
