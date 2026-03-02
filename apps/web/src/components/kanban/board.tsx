'use client';

import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useState, useEffect } from 'react';
import { KanbanColumn } from './column';
import { TaskCard } from './card';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/components/ui/use-toast';

type Task = {
    id: string;
    title: string;
    description?: string | null;
    status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    projectId: string;
    orgId?: string;
    assignee?: any | null;
    dueDate?: Date | null;
};

type Props = {
    projectId: string;
    orgId: string;
    initialTasks: Task[];
    onTaskClick?: (task: Task) => void;
};

const COLUMNS = [
    { id: 'TODO', title: 'To Do', color: 'bg-slate-500' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-blue-500' },
    { id: 'IN_REVIEW', title: 'In Review', color: 'bg-amber-500' },
    { id: 'DONE', title: 'Done', color: 'bg-emerald-500' },
] as const;

export function KanbanBoard({ projectId, orgId, initialTasks, onTaskClick }: Props) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [originalStatus, setOriginalStatus] = useState<string | null>(null);

    const utils = trpc.useUtils();
    const { toast } = useToast();
    
    const updateTaskMutation = trpc.task.update.useMutation({
        onSuccess: (data, variables) => {
            utils.task.listByProject.invalidate({ projectId });
            const statusLabels: Record<string, string> = {
                TODO: 'To Do',
                IN_PROGRESS: 'In Progress',
                IN_REVIEW: 'In Review',
                DONE: 'Done',
            };
            toast({
                title: 'Task moved',
                description: variables.status 
                    ? `Task moved to ${statusLabels[variables.status] || variables.status}`
                    : 'Task updated successfully',
                duration: 2000,
            });
        },
        onError: () => {
            toast({
                title: 'Error',
                description: 'Failed to move task. Please try again.',
                variant: 'destructive',
                duration: 3000,
            });
        },
    });

    useEffect(() => {
        setTasks(initialTasks);
    }, [initialTasks]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const task = tasks.find((t) => t.id === active.id);
        if (task) {
            setActiveTask(task);
            setOriginalStatus(task.status);
        }
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        const activeTask = tasks.find((t) => t.id === activeId);
        if (!activeTask) return;

        const overColumnId = COLUMNS.find(c => c.id === overId)?.id;
        const overTask = tasks.find(t => t.id === overId);

        if (overColumnId && activeTask.status !== overColumnId) {
            setTasks((prev) => {
                return prev.map(t =>
                    t.id === activeId ? { ...t, status: overColumnId } : t
                );
            });
        } else if (overTask && activeTask.status !== overTask.status) {
            setTasks((prev) => {
                return prev.map(t =>
                    t.id === activeId ? { ...t, status: overTask.status } : t
                );
            });
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Get the current task from state (it may have been updated in dragOver)
        const currentTask = tasks.find((t) => t.id === activeId);
        if (!currentTask) return;

        let newStatus = currentTask.status;

        const overColumn = COLUMNS.find(c => c.id === overId);
        if (overColumn) {
            newStatus = overColumn.id;
        } else {
            const overTask = tasks.find(t => t.id === overId);
            if (overTask) {
                newStatus = overTask.status;
            }
        }

        // Compare with original status to see if it actually changed
        if (originalStatus && currentTask.status !== originalStatus) {
            updateTaskMutation.mutate({
                id: activeId,
                status: newStatus as any,
                orgId,
            });
        }

        setOriginalStatus(null);
    };

    return (
        <div className="h-full flex flex-col">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="flex h-full gap-4 overflow-x-auto">
                    {COLUMNS.map((col) => (
                        <KanbanColumn
                            key={col.id}
                            id={col.id}
                            title={col.title}
                            color={col.color}
                            tasks={tasks.filter((t) => t.status === col.id)}
                            onTaskClick={onTaskClick!}
                        />
                    ))}
                </div>

                <DragOverlay dropAnimation={null}>
                    {activeTask ? (
                        <div className="rotate-3 scale-105 shadow-2xl">
                            <TaskCard task={activeTask} onClick={() => { }} />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
