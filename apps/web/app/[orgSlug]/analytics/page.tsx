'use client';

import { useOrg } from '@/hooks/use-org';
import { trpc } from '@/lib/trpc';
import { Loader2, TrendingUp, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, Tracker, LineChart, DonutChart, BarChart } from '@tremor/react';

const STATUS_COLORS: Record<string, string> = {
    TODO: 'slate',
    IN_PROGRESS: 'blue',
    IN_REVIEW: 'amber',
    DONE: 'emerald',
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

    const donutData = completion?.statusCounts.map(s => ({
        name: s.status.replace('_', ' '),
        value: s.count,
    })) || [];

    // Mock data for tracker - pretend recent 10 tasks completed
    const trackerData = Array.from({ length: 15 }).map((_, i) => ({
        color: Math.random() > 0.3 ? 'emerald' : 'rose',
        tooltip: Math.random() > 0.3 ? 'Operational' : 'Delayed',
    }));

    return (
        <div className="flex flex-col h-full p-6 space-y-6 overflow-y-auto bg-slate-50 dark:bg-[#0a0a0a]">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Analytics</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Performance insights for {org?.name}
                </p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card decoration="top" decorationColor="blue">
                    <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content flex items-center justify-between">
                        Total Tasks
                        <CheckCircle2 className="h-4 w-4 text-blue-500" />
                    </p>
                    <p className="text-tremor-metric font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
                        {completion?.total ?? 0}
                    </p>
                </Card>
                <Card decoration="top" decorationColor="emerald">
                    <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content flex items-center justify-between">
                        Completed
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </p>
                    <p className="text-tremor-metric font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
                        {completion?.done ?? 0}
                    </p>
                </Card>
                <Card decoration="top" decorationColor="indigo">
                    <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content flex items-center justify-between">
                        Completion Rate
                        <CheckCircle2 className="h-4 w-4 text-indigo-500" />
                    </p>
                    <p className="text-tremor-metric font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
                        {completion?.completionRate ?? 0}%
                    </p>
                </Card>
                <Card decoration="top" decorationColor="rose">
                    <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content flex items-center justify-between">
                        Overdue
                        <AlertTriangle className="h-4 w-4 text-rose-500" />
                    </p>
                    <p className="text-tremor-metric font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
                        {completion?.overdue ?? 0}
                    </p>
                </Card>
            </div>

            {/* Tracker Component across full width */}
            <Card>
                <p className="text-tremor-default flex items-center justify-between">
                    <span className="text-tremor-content-strong dark:text-dark-tremor-content-strong font-medium">Recent Task Health</span>
                    <span className="text-tremor-content dark:text-dark-tremor-content">Uptime 98.1%</span>
                </p>
                <Tracker data={trackerData} className="mt-2" />
            </Card>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Velocity Chart */}
                <Card>
                    <h3 className="text-lg font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong mb-1">Team Velocity</h3>
                    <p className="text-sm text-tremor-content dark:text-dark-tremor-content mb-6">Tasks completed per week</p>
                    <LineChart
                        className="h-72"
                        data={velocity || []}
                        index="week"
                        categories={['count']}
                        colors={['blue']}
                        yAxisWidth={40}
                    />
                </Card>

                {/* Task Status Distribution */}
                <Card>
                    <h3 className="text-lg font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong mb-1">Task Distribution</h3>
                    <p className="text-sm text-tremor-content dark:text-dark-tremor-content mb-6">Breakdown by status</p>
                    <div className="flex justify-center h-72">
                        <DonutChart
                            className="h-full w-full max-w-sm"
                            data={donutData}
                            category="value"
                            index="name"
                            colors={['slate', 'blue', 'amber', 'emerald']}
                            valueFormatter={(number) => `${number} tasks`}
                        />
                    </div>
                </Card>
            </div>

            {/* Member Activity */}
            <Card>
                <h3 className="text-lg font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong mb-1">Member Activity</h3>
                <p className="text-sm text-tremor-content dark:text-dark-tremor-content mb-6">Actions per day over the last 28 days</p>
                <BarChart
                    className="h-72"
                    data={memberActivity || []}
                    index="date"
                    categories={['count']}
                    colors={['indigo']}
                    yAxisWidth={48}
                />
            </Card>
        </div>
    );
}
