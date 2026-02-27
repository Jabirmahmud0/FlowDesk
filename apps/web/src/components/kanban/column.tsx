'use client';

import { SortableContext } from '@dnd-kit/sortable';
import { TaskCard } from './card';
import { useDroppable } from '@dnd-kit/core';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type Props = {
    id: string; // Column ID (status)
    title: string;
    tasks: any[];
    onTaskClick: (task: any) => void;
};

const STATUS_COLORS: Record<string, string> = {
    TODO: 'bg-slate-400',
    IN_PROGRESS: 'bg-blue-500',
    IN_REVIEW: 'bg-amber-500',
    DONE: 'bg-green-500',
};

export function KanbanColumn({ id, title, tasks, onTaskClick }: Props) {
    const [collapsed, setCollapsed] = useState(false);
    const { setNodeRef } = useDroppable({
        id: id,
        data: { type: 'Column', id },
    });

    return (
        <div className="flex flex-col h-full w-[300px] min-w-[300px] max-w-[300px] bg-muted/30 rounded-xl border border-muted p-2">
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="p-2 mb-2 flex items-center justify-between w-full text-left hover:bg-muted/50 rounded-lg transition-colors"
            >
                <h3 className="font-semibold text-sm text-foreground/80 flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", STATUS_COLORS[id] || 'bg-primary/50')} />
                    {title}
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground bg-background/50 px-2 py-0.5 rounded-md">
                        {tasks.length}
                    </span>
                    <motion.div
                        animate={{ rotate: collapsed ? -90 : 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    >
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </motion.div>
                </div>
            </button>

            <AnimatePresence initial={false}>
                {!collapsed && (
                    <motion.div
                        ref={setNodeRef}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="flex-1 flex flex-col gap-2 overflow-y-auto overflow-hidden min-h-0"
                    >
                        <SortableContext items={tasks.map(t => t.id)}>
                            {tasks.map((task, index) => (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.03, duration: 0.15 }}
                                >
                                    <TaskCard task={task} onClick={onTaskClick} />
                                </motion.div>
                            ))}
                        </SortableContext>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
