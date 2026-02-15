'use client';

import { useOrg } from '@/hooks/use-org';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DashboardStats } from '@/components/dashboard/dashboard-stats';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
    const { org, isLoading } = useOrg();

    if (isLoading) {
        return <div className="p-8">Loading...</div>;
    }

    if (!org) {
        return <div className="p-8">Organization not found</div>;
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <div className="flex items-center space-x-2">
                    {/* Add date range picker or download button later */}
                </div>
            </div>
            <div className="space-y-4">
                <DashboardStats orgId={org.id} />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <RecentActivity orgId={org.id} />
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                                Chart Placeholder (Coming Soon)
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
