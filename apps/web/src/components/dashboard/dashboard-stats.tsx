'use client';

import { trpc } from '@/lib/trpc';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Clock, ListTodo, Bell, TrendingUp, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardStatsProps {
    orgId: string;
}

export function DashboardStats({ orgId }: DashboardStatsProps) {
    const { data: tasks, isLoading: tasksLoading } = trpc.task.myTasks.useQuery({ orgId });
    const { data: unreadCount, isLoading: notifLoading } = trpc.notification.getUnreadCount.useQuery(
        undefined,
        { enabled: !!orgId }
    );
    const { data: completion } = trpc.analytics.getTaskCompletion.useQuery({ orgId });

    if (tasksLoading || notifLoading) {
        return (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="h-28 animate-pulse bg-muted/50" />
                ))}
            </div>
        );
    }

    const totalTasks = tasks?.length || 0;
    const completedTasks = tasks?.filter(t => t.status === 'DONE').length || 0;
    const overdueTasks = tasks?.filter(t =>
        t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE'
    ).length || 0;
    const inProgressTasks = tasks?.filter(t => t.status === 'IN_PROGRESS').length || 0;
    const completionRate = completion?.completionRate || 0;

    const stats = [
        {
            label: 'My Tasks',
            value: totalTasks,
            sub: `${inProgressTasks} in progress`,
            icon: ListTodo,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            trend: null,
        },
        {
            label: 'Completed',
            value: completedTasks,
            sub: `${completionRate}% completion rate`,
            icon: CheckCircle2,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            trend: completionRate >= 50 ? 'up' : 'down',
        },
        {
            label: 'Overdue',
            value: overdueTasks,
            sub: overdueTasks === 0 ? 'All on track 🎉' : 'Needs attention',
            icon: overdueTasks > 0 ? AlertCircle : Clock,
            color: overdueTasks > 0 ? 'text-red-500' : 'text-orange-500',
            bg: overdueTasks > 0 ? 'bg-red-500/10' : 'bg-orange-500/10',
            trend: overdueTasks === 0 ? 'up' : 'down',
        },
        {
            label: 'Notifications',
            value: unreadCount || 0,
            sub: (unreadCount || 0) === 0 ? 'All caught up' : 'Unread alerts',
            icon: Bell,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
            trend: null,
        },
    ];

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
                <Card
                    key={stat.label}
                    className="relative overflow-hidden border border-border/50 hover:border-border transition-colors hover:shadow-md"
                >
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1 min-w-0">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {stat.label}
                                </p>
                                <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                                <p className="text-xs text-muted-foreground truncate">{stat.sub}</p>
                            </div>
                            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', stat.bg)}>
                                <stat.icon className={cn('h-5 w-5', stat.color)} />
                            </div>
                        </div>
                        {stat.trend && (
                            <div className={cn(
                                'mt-3 flex items-center gap-1 text-xs font-medium',
                                stat.trend === 'up' ? 'text-emerald-500' : 'text-red-500'
                            )}>
                                <TrendingUp className={cn('h-3 w-3', stat.trend === 'down' && 'rotate-180')} />
                                {stat.trend === 'up' ? 'On track' : 'Behind'}
                            </div>
                        )}
                    </CardContent>
                    {/* Subtle gradient accent */}
                    <div className={cn('absolute bottom-0 left-0 right-0 h-0.5', stat.bg)} />
                </Card>
            ))}
        </div>
    );
}
