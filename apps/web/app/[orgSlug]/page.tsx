'use client';

import { useOrg } from '@/hooks/use-org';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardStats } from '@/components/dashboard/dashboard-stats';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { OverviewCharts } from '@/components/dashboard/overview-charts';
import { trpc } from '@/lib/trpc';
import { Loader2, Plus, ArrowRight, CheckSquare, FolderKanban, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
    TODO: 'bg-slate-500',
    IN_PROGRESS: 'bg-blue-500',
    IN_REVIEW: 'bg-amber-500',
    DONE: 'bg-emerald-500',
    CANCELLED: 'bg-red-500',
};

const PRIORITY_COLORS: Record<string, string> = {
    LOW: 'text-slate-400',
    MEDIUM: 'text-blue-400',
    HIGH: 'text-orange-400',
    URGENT: 'text-red-400',
};

function MyTasksPanel({ orgId }: { orgId: string }) {
    const { data: tasks, isLoading } = trpc.task.myTasks.useQuery({ orgId });
    const pendingTasks = tasks?.filter(t => t.status === 'TODO' || t.status === 'IN_PROGRESS' || t.status === 'IN_REVIEW').slice(0, 6) || [];


    if (isLoading) {
        return (
            <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-12 rounded-lg bg-muted/50 animate-pulse" />
                ))}
            </div>
        );
    }

    if (pendingTasks.length === 0) {
        return (
            <div className="text-center py-8">
                <CheckSquare className="h-8 w-8 mx-auto mb-2 text-emerald-500/50" />
                <p className="text-sm text-muted-foreground font-medium">All caught up!</p>
                <p className="text-xs text-muted-foreground mt-1">No pending tasks assigned to you.</p>
            </div>
        );
    }

    return (
        <div className="space-y-1.5">
            {pendingTasks.map((task: any) => (
                <div
                    key={task.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/50 transition-colors group cursor-default"
                >
                    <div className={cn('w-2 h-2 rounded-full flex-shrink-0', STATUS_COLORS[task.status] || 'bg-muted')} />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                            {task.project?.name}
                            {task.dueDate && (
                                <span className={cn(
                                    'ml-2',
                                    new Date(task.dueDate) < new Date() ? 'text-red-400 font-medium' : ''
                                )}>
                                    · {new Date(task.dueDate) < new Date() ? 'Overdue' : `Due ${new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                                </span>
                            )}
                        </p>
                    </div>
                    <Badge variant="outline" className={cn('text-[10px] capitalize flex-shrink-0', PRIORITY_COLORS[task.priority])}>
                        {task.priority?.toLowerCase()}
                    </Badge>
                </div>
            ))}
        </div>
    );
}

export default function DashboardPage() {
    const { org, isLoading } = useOrg();
    const params = useParams();
    const orgSlug = params?.orgSlug as string;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
                    <p className="text-sm text-muted-foreground">Loading your workspace...</p>
                </div>
            </div>
        );
    }

    if (!org) return null;

    return (
        <div className="flex-1 space-y-6 p-6 pt-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Good {getTimeGreeting()}, {org.name} 👋
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Here's what's happening across your organization.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/${orgSlug}/analytics`}>
                            <Zap className="h-3.5 w-3.5 mr-1.5" />
                            Analytics
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats Row */}
            <DashboardStats orgId={org.id} />

            {/* Main Grid */}
            <div className="grid gap-5 lg:grid-cols-3">
                {/* My Tasks */}
                <Card className="lg:col-span-1 border border-border/50">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <CheckSquare className="h-4 w-4 text-muted-foreground" />
                                My Tasks
                            </CardTitle>
                            <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                                <Link href={`/${orgSlug}/members`}>
                                    View all <ArrowRight className="h-3 w-3 ml-1" />
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <MyTasksPanel orgId={org.id} />
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <div className="lg:col-span-2">
                    <RecentActivity orgId={org.id} />
                </div>
            </div>

            {/* Charts */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold flex items-center gap-2">
                        <FolderKanban className="h-4 w-4 text-muted-foreground" />
                        Analytics Overview
                    </h2>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                        <Link href={`/${orgSlug}/analytics`}>
                            Full analytics <ArrowRight className="h-3 w-3 ml-1" />
                        </Link>
                    </Button>
                </div>
                <OverviewCharts orgId={org.id} />
            </div>
        </div>
    );
}

function getTimeGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
}
