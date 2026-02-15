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
// import { Button } from '@/components/ui/button';
// import { Plus } from 'lucide-react';

type Task = {
    id: string;
    title: string;
    description?: string | null;
    status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    projectId: string;
    // ... other fields
};

type Props = {
    projectId: string;
    initialTasks: Task[];
    onTaskClick?: (task: Task) => void;
};

const COLUMNS = [
    { id: 'TODO', title: 'To Do' },
    { id: 'IN_PROGRESS', title: 'In Progress' },
    { id: 'IN_REVIEW', title: 'In Review' },
    { id: 'DONE', title: 'Done' },
] as const;

export function KanbanBoard({ projectId, initialTasks, onTaskClick }: Props) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [activeTask, setActiveTask] = useState<Task | null>(null);

    const utils = trpc.useUtils();
    const updateTaskMutation = trpc.task.update.useMutation({
        onSuccess: () => {
            utils.task.listByProject.invalidate({ projectId });
        }
    });

    // Sync with server state if re-fetched
    useEffect(() => {
        setTasks(initialTasks);
    }, [initialTasks]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Prevent accidental drags
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const task = tasks.find((t) => t.id === active.id);
        if (task) setActiveTask(task);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // Find the containers
        const activeTask = tasks.find((t) => t.id === activeId);
        const overTask = tasks.find((t) => t.id === overId);

        if (!activeTask) return;

        // If over a column
        const overColumnId = COLUMNS.find(c => c.id === overId)?.id;

        if (overColumnId && activeTask.status !== overColumnId) {
            setTasks((prev) => {
                return prev.map(t =>
                    t.id === activeId ? { ...t, status: overColumnId } : t
                );
            });
        } else if (overTask && activeTask.status !== overTask.status) {
            // Dragging over a task in a different column
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

        const activeTask = tasks.find((t) => t.id === activeId);
        if (!activeTask) return;

        let newStatus = activeTask.status;

        // If dropped on a column
        const overColumn = COLUMNS.find(c => c.id === overId);
        if (overColumn) {
            newStatus = overColumn.id;
        } else {
            // If dropped on another task
            const overTask = tasks.find(t => t.id === overId);
            if (overTask) {
                newStatus = overTask.status;
            }
        }

        if (activeTask.status !== newStatus) {
            // Optimistic update was mostly handled in DragOver, but finalize here
            updateTaskMutation.mutate({
                id: activeId,
                status: newStatus
            });
        }
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
                <div className="flex h-full gap-4 overflow-x-auto pb-4">
                    {COLUMNS.map((col) => (
                        <KanbanColumn
                            key={col.id}
                            id={col.id}
                            title={col.title}
                            tasks={tasks.filter((t) => t.status === col.id)}
                            onTaskClick={onTaskClick!}
                        />
                    ))}
                </div>

                <DragOverlay>
                    {activeTask ? <TaskCard task={activeTask} onClick={() => { }} /> : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
