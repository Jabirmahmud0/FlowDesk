'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import { TaskCard } from './card';
import { cn } from '@/lib/utils';

type Props = {
    id: string;
    title: string;
    color: string;
    tasks: any[];
    onTaskClick: (task: any) => void;
};

export function KanbanColumn({ id, title, color, tasks, onTaskClick }: Props) {
    const { setNodeRef, isOver } = useDroppable({
        id,
    });

    return (
        <div className="flex flex-col h-full min-w-[300px] max-w-[300px]">
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 px-2 shrink-0">
                <div className="flex items-center gap-2">
                    <div className={cn('w-3 h-3 rounded-full', color)} />
                    <h3 className="font-semibold text-sm">{title}</h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {tasks.length}
                    </span>
                </div>
            </div>

            {/* Column Body */}
            <div
                ref={setNodeRef}
                className={cn(
                    'flex-1 rounded-xl p-2 transition-colors duration-200 overflow-y-auto min-h-0',
                    isOver && 'bg-muted/50 ring-2 ring-primary/20',
                    'bg-muted/30'
                )}
            >
                <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                        {tasks.map((task) => (
                            <motion.div
                                key={task.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <TaskCard task={task} onClick={() => onTaskClick(task)} />
                            </motion.div>
                        ))}
                    </div>
                </SortableContext>

                {tasks.length === 0 && (
                    <div className="flex items-center justify-center h-32 text-muted-foreground text-sm border-2 border-dashed border-muted-foreground/20 rounded-xl">
                        No tasks
                    </div>
                )}
            </div>
        </div>
    );
}
