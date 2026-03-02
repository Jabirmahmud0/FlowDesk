'use client';

import { useOrg } from '@/hooks/use-org';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from 'recharts';
import { Activity, TrendingUp, CheckCircle, Clock } from 'lucide-react';

export function AnalyticsDashboard() {
    const { org } = useOrg();

    const { data: stats } = trpc.analytics.getDashboardStats.useQuery(
        { orgId: org?.id!, days: 30 },
        { enabled: !!org?.id }
    );

    const { data: velocity } = trpc.analytics.getVelocity.useQuery(
        { orgId: org?.id!, days: 30 },
        { enabled: !!org?.id }
    );

    const { data: completion } = trpc.analytics.getTaskCompletion.useQuery(
        { orgId: org?.id! },
        { enabled: !!org?.id }
    );

    const statCards = [
        {
            title: 'Total Tasks',
            value: stats?.totalTasks || 0,
            icon: Activity,
            description: 'All time',
        },
        {
            title: 'Completed',
            value: stats?.completedTasks || 0,
            icon: CheckCircle,
            description: `${completion?.completionRate.toFixed(1) || 0}% completion rate`,
        },
        {
            title: 'In Progress',
            value: stats?.inProgressTasks || 0,
            icon: TrendingUp,
            description: 'Active tasks',
        },
        {
            title: 'Overdue',
            value: stats?.overdueTasks || 0,
            icon: Clock,
            description: 'Past due date',
            variant: 'destructive' as const,
        },
    ];

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">{stat.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Velocity Chart */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Team Velocity</CardTitle>
                        <CardDescription>Tasks completed per week</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={velocity || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="week" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line
                                        type="monotone"
                                        dataKey="completed"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={2}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Task Completion</CardTitle>
                        <CardDescription>Completion overview</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={[
                                        { name: 'Completed', value: completion?.done || 0 },
                                        { name: 'Remaining', value: (completion?.total || 0) - (completion?.done || 0) },
                                    ]}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="hsl(var(--primary))" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
