'use client';

import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskCard } from './card';
import { useDroppable } from '@dnd-kit/core';

type Props = {
    id: string; // Column ID (status)
    title: string;
    tasks: any[];
    onTaskClick: (task: any) => void;
};

export function KanbanColumn({ id, title, tasks, onTaskClick }: Props) {
    const { setNodeRef } = useDroppable({
        id: id,
        data: { type: 'Column', id },
    });

    return (
        <div className="flex flex-col h-full w-[300px] min-w-[300px] max-w-[300px] bg-muted/30 rounded-xl border border-muted p-2">
            <div className="p-2 mb-2 flex items-center justify-between">
                <h3 className="font-semibold text-sm text-foreground/80 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary/50" />
                    {title}
                </h3>
                <span className="text-xs text-muted-foreground bg-background/50 px-2 py-0.5 rounded-md">
                    {tasks.length}
                </span>
            </div>

            <div ref={setNodeRef} className="flex-1 flex flex-col gap-2 overflow-y-auto min-h-[100px]">
                <SortableContext items={tasks.map(t => t.id)}>
                    {tasks.map((task) => (
                        <TaskCard key={task.id} task={task} onClick={onTaskClick} />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
}
