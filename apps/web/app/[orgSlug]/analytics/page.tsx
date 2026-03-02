'use client';

import { useState } from 'react';
import { useOrg } from '@/hooks/use-org';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';
import {
    TrendingUp,
    TrendingDown,
    CheckCircle2,
    Clock,
    AlertCircle,
    Activity,
    Users,
    Target,
    Calendar,
    Download,
} from 'lucide-react';
import { format } from 'date-fns';
import { LoadingPage } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

const CHART_COLORS = {
    primary: 'hsl(var(--primary))',
    success: 'hsl(142, 76%, 36%)',
    warning: 'hsl(38, 92%, 48%)',
    danger: 'hsl(0, 84%, 60%)',
    info: 'hsl(217, 91%, 60%)',
    muted: 'hsl(var(--muted-foreground))',
};

const STATUS_COLORS = {
    TODO: 'hsl(217, 19%, 27%)',
    IN_PROGRESS: 'hsl(217, 91%, 60%)',
    IN_REVIEW: 'hsl(38, 92%, 48%)',
    DONE: 'hsl(142, 76%, 36%)',
};

const TIME_RANGES = [
    { value: '7', label: 'Last 7 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 90 days' },
    { value: '365', label: 'Last year' },
];

export default function AnalyticsPage() {
    const { org } = useOrg();
    const [timeRange, setTimeRange] = useState('30');

    const { data: stats, isLoading: statsLoading } = trpc.analytics.getDashboardStats.useQuery(
        { orgId: org?.id!, days: parseInt(timeRange) },
        { enabled: !!org?.id }
    );

    const { data: velocity, isLoading: velocityLoading } = trpc.analytics.getVelocity.useQuery(
        { orgId: org?.id!, days: parseInt(timeRange) },
        { enabled: !!org?.id }
    );

    const { data: completion, isLoading: completionLoading } = trpc.analytics.getTaskCompletion.useQuery(
        { orgId: org?.id! },
        { enabled: !!org?.id }
    );

    const { data: memberActivity, isLoading: activityLoading } = trpc.analytics.getMemberActivity.useQuery(
        { orgId: org?.id!, days: parseInt(timeRange) },
        { enabled: !!org?.id }
    );

    const isLoading = statsLoading || velocityLoading || completionLoading || activityLoading;

    if (isLoading) {
        return <LoadingPage message="Loading analytics..." />;
    }

    if (!stats || !completion || completion.total === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <EmptyState
                    icon={Activity}
                    title="No analytics data yet"
                    description="Start creating tasks and projects to see analytics and insights about your team's performance."
                />
            </div>
        );
    }

    // Prepare chart data
    const velocityData = velocity?.map((v, i) => ({
        ...v,
        cumulative: velocity?.slice(0, i + 1).reduce((acc, curr) => acc + curr.completed, 0) || 0,
    })) || [];

    const statusDistributionData = completion.statusCounts.map((s) => ({
        name: s.status.replace('_', ' '),
        value: s.count,
        color: STATUS_COLORS[s.status as keyof typeof STATUS_COLORS] || CHART_COLORS.muted,
    }));

    const memberActivityData = memberActivity?.map((a) => ({
        date: format(new Date(a.date), 'MMM dd'),
        actions: a.count,
    })) || [];

    const completionRate = completion.completionRate || 0;
    const completionTrend = completionRate >= 80 ? 'positive' : completionRate >= 50 ? 'neutral' : 'negative';

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-muted/20">
            {/* Header */}
            <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex items-center justify-between py-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
                        <p className="text-sm text-muted-foreground">
                            Performance insights for {org?.name}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={timeRange} onValueChange={setTimeRange}>
                            <SelectTrigger className="w-[140px]">
                                <Calendar className="h-4 w-4 mr-2" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {TIME_RANGES.map((range) => (
                                    <SelectItem key={range.value} value={range.value}>
                                        {range.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon">
                            <Download className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container py-6 space-y-6">
                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Tasks"
                        value={completion.total || 0}
                        description="All time tasks created"
                        icon={Target}
                        trend={12}
                        trendLabel="vs last period"
                    />
                    <StatCard
                        title="Completion Rate"
                        value={`${completionRate.toFixed(1)}%`}
                        description={`${completion.done || 0} of ${completion.total} tasks completed`}
                        icon={CheckCircle2}
                        trend={completionTrend === 'positive' ? 8 : completionTrend === 'neutral' ? 0 : -5}
                        trendLabel="vs last period"
                        trendType={completionTrend}
                    />
                    <StatCard
                        title="In Progress"
                        value={stats.inProgressTasks || 0}
                        description="Active tasks right now"
                        icon={Activity}
                        color="info"
                    />
                    <StatCard
                        title="Overdue Tasks"
                        value={completion.overdue || 0}
                        description="Past due date"
                        icon={Clock}
                        color="danger"
                        trend={-3}
                        trendLabel="vs last week"
                        trendType={completion.overdue > 5 ? 'negative' : 'positive'}
                    />
                </div>

                {/* Main Charts */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Velocity Chart - 2 columns */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold">Team Velocity</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Tasks completed over time
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={velocityData}>
                                        <defs>
                                            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                                <stop
                                                    offset="5%"
                                                    stopColor={CHART_COLORS.primary}
                                                    stopOpacity={0.3}
                                                />
                                                <stop
                                                    offset="95%"
                                                    stopColor={CHART_COLORS.primary}
                                                    stopOpacity={0}
                                                />
                                            </linearGradient>
                                            <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                                                <stop
                                                    offset="5%"
                                                    stopColor={CHART_COLORS.success}
                                                    stopOpacity={0.3}
                                                />
                                                <stop
                                                    offset="95%"
                                                    stopColor={CHART_COLORS.success}
                                                    stopOpacity={0}
                                                />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis
                                            dataKey="week"
                                            className="text-xs"
                                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                        />
                                        <YAxis
                                            className="text-xs"
                                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--background))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px',
                                            }}
                                        />
                                        <Legend />
                                        <Area
                                            type="monotone"
                                            dataKey="completed"
                                            name="Weekly"
                                            stroke={CHART_COLORS.primary}
                                            fillOpacity={1}
                                            fill="url(#colorCompleted)"
                                            strokeWidth={2}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="cumulative"
                                            name="Cumulative"
                                            stroke={CHART_COLORS.success}
                                            fillOpacity={1}
                                            fill="url(#colorCumulative)"
                                            strokeWidth={2}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Status Distribution - 1 column */}
                    <Card>
                        <CardHeader>
                            <div>
                                <h3 className="text-lg font-semibold">Task Distribution</h3>
                                <p className="text-sm text-muted-foreground">
                                    Breakdown by status
                                </p>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusDistributionData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                            nameKey="name"
                                            label={({ name, percent }) =>
                                                `${name} ${((percent || 0) * 100).toFixed(0)}%`
                                            }
                                            labelLine={false}
                                        >
                                            {statusDistributionData.map((entry, index) => (
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
                                {/* Legend */}
                                <div className="flex flex-wrap justify-center gap-3 mt-4">
                                    {statusDistributionData.map((item) => (
                                        <div
                                            key={item.name}
                                            className="flex items-center gap-2 text-sm"
                                        >
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: item.color }}
                                            />
                                            <span className="text-muted-foreground">{item.name}</span>
                                            <span className="font-medium">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Member Activity Chart */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">Team Activity</h3>
                                <p className="text-sm text-muted-foreground">
                                    Actions per day over the last {timeRange} days
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span>
                                    {memberActivity?.reduce((acc, curr) => acc + curr.count, 0) || 0} total
                                    actions
                                </span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={memberActivityData}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis
                                        dataKey="date"
                                        className="text-xs"
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                    />
                                    <YAxis
                                        className="text-xs"
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--background))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px',
                                        }}
                                    />
                                    <Bar
                                        dataKey="actions"
                                        fill={CHART_COLORS.info}
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Additional Insights */}
                <div className="grid gap-4 md:grid-cols-3">
                    <InsightCard
                        title="Average Completion Time"
                        value="2.4 days"
                        description="Per task on average"
                        trend={-0.3}
                        trendLabel="faster than last week"
                        icon={Clock}
                    />
                    <InsightCard
                        title="Team Productivity"
                        value="87%"
                        description="Tasks on time"
                        trend={5}
                        trendLabel="improvement"
                        icon={TrendingUp}
                    />
                    <InsightCard
                        title="Pending Reviews"
                        value={(completion.statusCounts.find(s => s.status === 'IN_REVIEW')?.count || 0).toString()}
                        description="Tasks in review"
                        icon={AlertCircle}
                        color="warning"
                    />
                </div>
            </div>
        </div>
    );
}

// Stat Card Component
function StatCard({
    title,
    value,
    description,
    icon: Icon,
    trend,
    trendLabel,
    trendType,
    color = 'default',
}: {
    title: string;
    value: string | number;
    description: string;
    icon: React.ElementType;
    trend?: number;
    trendLabel?: string;
    trendType?: 'positive' | 'negative' | 'neutral';
    color?: 'default' | 'info' | 'danger' | 'warning' | 'success';
}) {
    const colorClasses = {
        default: 'text-primary',
        info: 'text-blue-500',
        danger: 'text-red-500',
        warning: 'text-amber-500',
        success: 'text-emerald-500',
    };

    const getTrendIcon = () => {
        if (trend === undefined) return null;
        if (trend > 0)
            return <TrendingUp className="h-3 w-3 text-emerald-500" />;
        if (trend < 0)
            return <TrendingDown className="h-3 w-3 text-red-500" />;
        return null;
    };

    const getTrendColor = () => {
        if (trend === undefined) return '';
        if (trendType === 'negative') return trend < 0 ? 'text-emerald-500' : 'text-red-500';
        if (trendType === 'positive') return trend > 0 ? 'text-emerald-500' : 'text-red-500';
        return trend > 0 ? 'text-emerald-500' : trend < 0 ? 'text-red-500' : 'text-muted-foreground';
    };

    return (
        <Card className="relative overflow-hidden">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold tracking-tight">{value}</p>
                        <p className="text-xs text-muted-foreground">{description}</p>
                        {trend !== undefined && (
                            <div className="flex items-center gap-1 pt-1">
                                {getTrendIcon()}
                                <span className={cn('text-xs font-medium', getTrendColor())}>
                                    {trend > 0 ? '+' : ''}
                                    {trend}%
                                </span>
                                {trendLabel && (
                                    <span className="text-xs text-muted-foreground">{trendLabel}</span>
                                )}
                            </div>
                        )}
                    </div>
                    <div className={cn('p-3 rounded-full bg-muted', colorClasses[color])}>
                        <Icon className="h-5 w-5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Insight Card Component
function InsightCard({
    title,
    value,
    description,
    trend,
    trendLabel,
    icon: Icon,
    color = 'default',
}: {
    title: string;
    value: string | number;
    description: string;
    trend?: number;
    trendLabel?: string;
    icon: React.ElementType;
    color?: 'default' | 'info' | 'danger' | 'warning' | 'success';
}) {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-muted">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium">{title}</p>
                        <div className="flex items-center gap-2">
                            <p className="text-xl font-bold">{value}</p>
                            {trend !== undefined && (
                                <span
                                    className={cn(
                                        'text-xs font-medium',
                                        trend > 0 ? 'text-emerald-500' : 'text-red-500'
                                    )}
                                >
                                    {trend > 0 ? '+' : ''}
                                    {trend}%
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">{description}</p>
                        {trendLabel && (
                            <p className="text-xs text-muted-foreground mt-1">{trendLabel}</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
