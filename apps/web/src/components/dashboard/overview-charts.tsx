'use client';

import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CheckCircle2, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OverviewChartsProps {
    orgId: string;
}

export function OverviewCharts({ orgId }: OverviewChartsProps) {
    const { data: stats } = trpc.analytics.getDashboardStats.useQuery({ orgId, days: 30 }, {
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    const { data: completion } = trpc.analytics.getTaskCompletion.useQuery({ orgId }, {
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    // Prepare data for task status distribution (Pie Chart)
    const statusData = [
        { name: 'Completed', value: stats?.completedTasks || 0, color: 'hsl(142, 76%, 36%)' },
        { name: 'In Progress', value: stats?.inProgressTasks || 0, color: 'hsl(217, 91%, 60%)' },
        { name: 'Overdue', value: stats?.overdueTasks || 0, color: 'hsl(0, 84%, 60%)' },
    ].filter(s => s.value > 0);

    // Simple activity data
    const activityData = [
        { name: 'Total', value: stats?.totalTasks || 0 },
        { name: 'Done', value: stats?.completedTasks || 0 },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Stats Cards */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        Completed
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats?.completedTasks || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {completion?.completionRate || 0}% completion rate
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        In Progress
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats?.inProgressTasks || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">Active tasks</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        Overdue
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats?.overdueTasks || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-purple-500" />
                        Total
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalTasks || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">All tasks</p>
                </CardContent>
            </Card>

            {/* Task Status Pie Chart */}
            {statusData.length > 0 && (
                <Card className="md:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Task Status Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        innerRadius={50}
                                        outerRadius={80}
                                        dataKey="value"
                                        paddingAngle={2}
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--background))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px',
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-4 mt-4">
                            {statusData.map((item) => (
                                <div key={item.name} className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span className="text-xs text-muted-foreground">{item.name}</span>
                                    <span className="text-xs font-medium">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Activity Bar Chart */}
            <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Task Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={activityData}>
                                <XAxis
                                    dataKey="name"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--background))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px',
                                    }}
                                />
                                <Bar
                                    dataKey="value"
                                    fill="hsl(var(--primary))"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
