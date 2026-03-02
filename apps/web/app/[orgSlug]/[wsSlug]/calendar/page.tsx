'use client';

import { useOrg } from '@/hooks/use-org';
import { useWorkspace } from '@/hooks/use-workspace';
import { trpc } from '@/lib/trpc';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isToday,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { TaskDetailPanel } from '@/components/tasks/task-detail-panel';
import { TaskModal } from '@/components/tasks/task-modal';

const PRIORITY_COLORS: Record<string, string> = {
    URGENT: 'bg-red-500',
    HIGH: 'bg-orange-500',
    MEDIUM: 'bg-yellow-500',
    LOW: 'bg-blue-500',
    NONE: 'bg-slate-400',
};

export default function CalendarPage() {
    const { org } = useOrg();
    const { workspace, isLoading: wsLoading } = useWorkspace();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [viewingTask, setViewingTask] = useState<any | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const firstProjectId = workspace?.projects[0]?.id;

    const { data: tasks, isLoading: tLoading } = trpc.task.listByProject.useQuery(
        { projectId: firstProjectId!, orgId: org?.id! },
        { 
            enabled: !!firstProjectId && !!org?.id,
            staleTime: 1000 * 60 * 5,
        }
    );

    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
        const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
        return eachDayOfInterval({ start: calStart, end: calEnd });
    }, [currentMonth]);

    const tasksByDate = useMemo(() => {
        const map: Record<string, any[]> = {};
        tasks?.forEach((task: any) => {
            if (task.dueDate) {
                const key = format(new Date(task.dueDate), 'yyyy-MM-dd');
                if (!map[key]) map[key] = [];
                map[key].push(task);
            }
        });
        return map;
    }, [tasks]);

    const handleTaskClick = (task: any) => {
        setViewingTask(task);
        setIsDetailOpen(true);
    };

    const handleEditTask = (task: any) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    if (wsLoading || (firstProjectId && tLoading)) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!workspace) {
        return (
            <div className="p-12 text-center">
                <h2 className="text-xl font-semibold mb-2">Workspace not found</h2>
                <p className="text-muted-foreground">Please select a valid workspace.</p>
            </div>
        );
    }

    if (!firstProjectId) {
        return (
            <div className="p-12 text-center">
                <h2 className="text-xl font-semibold mb-2">No projects found</h2>
                <p className="text-muted-foreground">Create a project to view the calendar.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
                    <p className="text-muted-foreground text-sm">
                        Tasks by due date{workspace.projects[0] ? ` — ${workspace.projects[0].name}` : ''}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-lg font-semibold w-40 text-center">
                        {format(currentMonth, 'MMMM yyyy')}
                    </span>
                    <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" onClick={() => setCurrentMonth(new Date())}>
                        Today
                    </Button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 border rounded-lg overflow-hidden bg-card">
                {/* Day Headers */}
                <div className="grid grid-cols-7 border-b">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                        <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Day Cells */}
                <div className="grid grid-cols-7 auto-rows-fr" style={{ minHeight: 'calc(100% - 37px)' }}>
                    {calendarDays.map((day) => {
                        const dateKey = format(day, 'yyyy-MM-dd');
                        const dayTasks = tasksByDate[dateKey] || [];
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const isCurrentDay = isToday(day);

                        return (
                            <div
                                key={dateKey}
                                className={cn(
                                    'border-r border-b last:border-r-0 p-1.5 min-h-[100px] transition-colors',
                                    !isCurrentMonth && 'bg-muted/30 text-muted-foreground',
                                    isCurrentDay && 'bg-primary/5',
                                )}
                            >
                                <div className={cn(
                                    'text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full',
                                    isCurrentDay && 'bg-primary text-primary-foreground',
                                )}>
                                    {format(day, 'd')}
                                </div>
                                <div className="space-y-0.5 overflow-hidden">
                                    {dayTasks.slice(0, 3).map((task: any) => (
                                        <button
                                            key={task.id}
                                            onClick={() => handleTaskClick(task)}
                                            className="w-full text-left text-xs p-1 rounded hover:bg-accent transition-colors truncate flex items-center gap-1"
                                        >
                                            <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', PRIORITY_COLORS[task.priority] || 'bg-slate-400')} />
                                            <span className="truncate">{task.title}</span>
                                        </button>
                                    ))}
                                    {dayTasks.length > 3 && (
                                        <span className="text-xs text-muted-foreground pl-1">
                                            +{dayTasks.length - 3} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <TaskDetailPanel
                open={isDetailOpen}
                onOpenChange={setIsDetailOpen}
                task={viewingTask}
                onEdit={handleEditTask}
            />

            <TaskModal
                open={isModalOpen}
                onOpenChange={(open) => { setIsModalOpen(open); if (!open) setEditingTask(null); }}
                projectId={firstProjectId}
                task={editingTask}
            />
        </div>
    );
}
