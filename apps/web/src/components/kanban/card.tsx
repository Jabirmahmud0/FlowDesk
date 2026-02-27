'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card as UICard, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Calendar, User } from 'lucide-react';
import { motion } from 'framer-motion';

type Task = {
    id: string;
    title: string;
    description?: string | null;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    dueDate?: Date | null;
    assignee?: {
        name: string | null;
        image: string | null;
    } | null;
};

type Props = {
    task: Task;
    onClick: (task: Task) => void;
};

const priorityColors = {
    LOW: 'bg-slate-500',
    MEDIUM: 'bg-blue-500',
    HIGH: 'bg-orange-500',
    URGENT: 'bg-red-500',
};

export function TaskCard({ task, onClick }: Props) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id, data: { type: 'Task', task } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-50 h-[100px] rounded-xl border-2 border-primary/20 bg-muted/20"
            />
        );
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={() => onClick(task)}>
            <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
                <UICard className="cursor-grab hover:border-primary/50 hover:shadow-md transition-all mb-2">
                    <CardHeader className="p-3 pb-0 space-y-0">
                        <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-sm font-medium leading-tight">
                                {task.title}
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-3">
                        <div className="flex items-center justify-between mt-2">
                            <Badge variant="outline" className={cn("text-[10px] px-1 py-0 h-5 font-normal", priorityColors[task.priority] + "/10 text-foreground border-transparent")}>
                                <div className={cn("w-1.5 h-1.5 rounded-full mr-1", priorityColors[task.priority])} />
                                {task.priority}
                            </Badge>

                            {task.assignee && (
                                <Avatar className="h-5 w-5">
                                    <AvatarImage src={task.assignee.image || ''} />
                                    <AvatarFallback className="text-[9px]">
                                        {task.assignee.name?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    </CardContent>
                </UICard>
            </motion.div>
        </div>
    );
}

