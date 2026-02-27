'use client';

import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Loader2 } from 'lucide-react';

interface OverviewChartsProps {
    orgId: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function OverviewCharts({ orgId }: OverviewChartsProps) {
    const { data: analytics, isLoading } = trpc.analytics.getDashboardStats.useQuery({ orgId, days: 30 });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Prepare data for task status distribution (Pie Chart)
    const taskStatusData = analytics?.taskStatusDistribution.map((item: any) => ({
        name: item.status.replace('_', ' '),
        value: item.count,
    })) || [];

    // Prepare data for tasks created per day (Bar Chart)
    const tasksCreatedData = analytics?.tasksCreatedPerDay.map((item: any) => ({
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        tasks: item.count,
    })) || [];

    // Prepare data for activity by user (Bar Chart)
    const activityByUserData = analytics?.activityByUser.slice(0, 5).map((item: any) => ({
        user: item.userName || item.userEmail?.split('@')[0] || 'Unknown',
        activities: item.activityCount,
    })) || [];

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {/* Task Status Distribution - Pie Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Task Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px]">
                        {taskStatusData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={taskStatusData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {taskStatusData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                                No task data available
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Tasks Created Per Day - Bar Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Tasks Created (Last 30 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px]">
                        {tasksCreatedData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={tasksCreatedData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis 
                                        dataKey="date" 
                                        fontSize={12} 
                                        tickLine={false} 
                                        axisLine={false} 
                                    />
                                    <YAxis 
                                        fontSize={12} 
                                        tickLine={false} 
                                        axisLine={false} 
                                        tickFormatter={(value) => `${value}`}
                                    />
                                    <Tooltip 
                                        contentStyle={{ 
                                            borderRadius: '8px', 
                                            border: 'none',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                        }} 
                                    />
                                    <Bar 
                                        dataKey="tasks" 
                                        fill="#0088FE" 
                                        radius={[4, 4, 0, 0]} 
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                                No tasks created recently
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Activity by User - Bar Chart */}
            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Top Active Members (Last 30 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[200px]">
                        {activityByUserData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={activityByUserData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                    <XAxis 
                                        type="number" 
                                        fontSize={12} 
                                        tickLine={false} 
                                        axisLine={false} 
                                    />
                                    <YAxis 
                                        dataKey="user" 
                                        type="category" 
                                        fontSize={12} 
                                        tickLine={false} 
                                        axisLine={false}
                                        width={100}
                                    />
                                    <Tooltip 
                                        contentStyle={{ 
                                            borderRadius: '8px', 
                                            border: 'none',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                        }} 
                                    />
                                    <Bar 
                                        dataKey="activities" 
                                        fill="#8884D8" 
                                        radius={[0, 4, 4, 0]} 
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                                No activity data available
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
