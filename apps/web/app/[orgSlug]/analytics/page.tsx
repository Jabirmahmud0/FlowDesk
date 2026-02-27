'use client';

import { useOrg } from '@/hooks/use-org';
import { trpc } from '@/lib/trpc';
import { Loader2, TrendingUp, CheckCircle2, AlertTriangle, Users } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';

const STATUS_COLORS: Record<string, string> = {
    TODO: '#94a3b8',
    IN_PROGRESS: '#3b82f6',
    IN_REVIEW: '#f59e0b',
    DONE: '#22c55e',
};

export default function AnalyticsPage() {
    const { org } = useOrg();

    const { data: velocity, isLoading: vLoading } = trpc.analytics.getVelocity.useQuery(
        { orgId: org?.id!, days: 56 },
        { enabled: !!org?.id }
    );

    const { data: completion, isLoading: cLoading } = trpc.analytics.getTaskCompletion.useQuery(
        { orgId: org?.id! },
        { enabled: !!org?.id }
    );

    const { data: memberActivity, isLoading: mLoading } = trpc.analytics.getMemberActivity.useQuery(
        { orgId: org?.id!, days: 28 },
        { enabled: !!org?.id }
    );

    const isLoading = vLoading || cLoading || mLoading;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const pieData = completion?.statusCounts.map(s => ({
        name: s.status.replace('_', ' '),
        value: s.count,
        fill: STATUS_COLORS[s.status] || '#6b7280',
    })) || [];

    return (
        <div className="flex flex-col h-full p-6 space-y-6 overflow-y-auto">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
                <p className="text-muted-foreground text-sm">
                    Performance insights for {org?.name}
                </p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Total Tasks"
                    value={completion?.total ?? 0}
                    icon={<CheckCircle2 className="h-5 w-5 text-blue-500" />}
                />
                <StatCard
                    title="Completed"
                    value={completion?.done ?? 0}
                    icon={<TrendingUp className="h-5 w-5 text-green-500" />}
                />
                <StatCard
                    title="Completion Rate"
                    value={`${completion?.completionRate ?? 0}%`}
                    icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                />
                <StatCard
                    title="Overdue"
                    value={completion?.overdue ?? 0}
                    icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Velocity Chart */}
                <div className="border rounded-lg p-6 bg-card">
                    <h3 className="text-lg font-semibold mb-4">Team Velocity</h3>
                    <p className="text-sm text-muted-foreground mb-4">Tasks completed per week</p>
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={velocity || []}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="week" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                            <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="count"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={{ fill: '#3b82f6', r: 4 }}
                                name="Tasks Completed"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Task Status Distribution */}
                <div className="border rounded-lg p-6 bg-card">
                    <h3 className="text-lg font-semibold mb-4">Task Distribution</h3>
                    <p className="text-sm text-muted-foreground mb-4">Breakdown by status</p>
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={4}
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Member Activity */}
            <div className="border rounded-lg p-6 bg-card">
                <h3 className="text-lg font-semibold mb-4">Member Activity</h3>
                <p className="text-sm text-muted-foreground mb-4">Actions per day over the last 28 days</p>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={memberActivity || []}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                            }}
                        />
                        <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Actions" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
    return (
        <div className="border rounded-lg p-4 bg-card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{title}</span>
                {icon}
            </div>
            <div className="text-3xl font-bold">{value}</div>
        </div>
    );
}
