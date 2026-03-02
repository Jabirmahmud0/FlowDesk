'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Flag } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type Task = {
    id: string;
    title: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    assignee?: any | null;
    dueDate?: Date | null;
};

type Props = {
    task: Task;
    onClick: () => void;
};

const PRIORITY_STYLES = {
    URGENT: 'bg-red-500/10 text-red-600 hover:bg-red-500/20',
    HIGH: 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20',
    MEDIUM: 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20',
    LOW: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20',
};

const PRIORITY_ICONS = {
    URGENT: '🔴',
    HIGH: '🟠',
    MEDIUM: '🟡',
    LOW: '🟢',
};

export function TaskCard({ task, onClick }: Props) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <Card
                className={cn(
                    'p-3 cursor-pointer transition-all duration-200 group',
                    'hover:shadow-md hover:border-primary/50 hover:-translate-y-0.5',
                    'bg-background border-muted',
                    isDragging && 'shadow-xl rotate-2 scale-105 border-primary'
                )}
                onClick={onClick}
            >
                <div className="space-y-2">
                    {/* Title */}
                    <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors">
                        {task.title}
                    </p>

                    {/* Metadata */}
                    <div className="flex items-center justify-between gap-2">
                        {/* Priority Badge */}
                        <Badge
                            variant="secondary"
                            className={cn(
                                'text-[10px] font-medium px-1.5 py-0.5',
                                PRIORITY_STYLES[task.priority]
                            )}
                        >
                            <span className="mr-1">{PRIORITY_ICONS[task.priority]}</span>
                            {task.priority.toLowerCase()}
                        </Badge>

                        {/* Right side: Assignee + Due Date */}
                        <div className="flex items-center gap-1.5">
                            {/* Due Date */}
                            {task.dueDate && (
                                <div
                                    className={cn(
                                        'flex items-center gap-1 text-xs',
                                        isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'
                                    )}
                                >
                                    <Calendar className="h-3 w-3" />
                                    <span className="hidden sm:inline">
                                        {format(new Date(task.dueDate), 'MMM d')}
                                    </span>
                                </div>
                            )}

                            {/* Assignee Avatar */}
                            {task.assignee && (
                                <Avatar className="h-5 w-5">
                                    <AvatarImage src={task.assignee.avatarUrl} alt={task.assignee.name} />
                                    <AvatarFallback className="text-[10px]">
                                        {task.assignee.name?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
