'use client';

import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Clock, ListTodo } from 'lucide-react';

interface DashboardStatsProps {
    orgId: string;
}

export function DashboardStats({ orgId }: DashboardStatsProps) {
    const { data: tasks, isLoading: tasksLoading } = trpc.task.myTasks.useQuery({ orgId });
    const { data: notifications, isLoading: notifLoading } = trpc.notification.getUnreadCount.useQuery();

    if (tasksLoading || notifLoading) {
        return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse h-32" />
            ))}
        </div>;
    }

    const totalTasks = tasks?.length || 0;
    const completedTasks = tasks?.filter(t => t.status === 'DONE').length || 0;
    const pendingTasks = totalTasks - completedTasks;
    // Simple heuristic for "overdue" or "due soon" could be added if dates are present
    const dueTasks = tasks?.filter(t => t.dueDate && new Date(t.dueDate) > new Date()).length || 0;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                    <ListTodo className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalTasks}</div>
                    <p className="text-xs text-muted-foreground">Assigned to you</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{pendingTasks}</div>
                    <p className="text-xs text-muted-foreground">To do or In progress</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completed</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{completedTasks}</div>
                    <p className="text-xs text-muted-foreground">Finished tasks</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Unread Notifications</CardTitle>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        className="h-4 w-4 text-muted-foreground"
                    >
                        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                    </svg>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{notifications || 0}</div>
                    <p className="text-xs text-muted-foreground">Waiting for review</p>
                </CardContent>
            </Card>
        </div>
    );
}
