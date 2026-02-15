'use client';

import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface RecentActivityProps {
    orgId: string;
}

export function RecentActivity({ orgId }: RecentActivityProps) {
    // using myTasks as a proxy for "recent activity" for now, showing generally recent tasks
    // Ideally we would have a dedicated activity feed endpoint.
    const { data: tasks, isLoading } = trpc.task.myTasks.useQuery({ orgId });

    if (isLoading) {
        return <Card className="col-span-3">
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 animate-pulse">
                            <div className="h-10 w-10 rounded-full bg-muted" />
                            <div className="space-y-2 flex-1">
                                <div className="h-4 w-1/3 bg-muted rounded" />
                                <div className="h-3 w-1/4 bg-muted rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>;
    }

    const recentTasks = tasks?.slice(0, 5) || [];

    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>Recent Tasks</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                    {recentTasks.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No recent activity.</p>
                    ) : (
                        recentTasks.map((task) => (
                            <div key={task.id} className="flex items-center">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={task.assignee?.image || undefined} alt="Avatar" />
                                    <AvatarFallback>{task.assignee?.name?.[0] || '?'}</AvatarFallback>
                                </Avatar>
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">{task.title}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {task.project?.name} • {task.status}
                                    </p>
                                </div>
                                <div className="ml-auto font-medium">
                                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
