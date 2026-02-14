'use client';

import { useOrg } from '@/hooks/use-org';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function DashboardPage() {
    const { org, isLoading } = useOrg();

    if (isLoading) {
        return <div className="p-8">Loading...</div>;
    }

    if (!org) {
        return <div className="p-8">Organization not found</div>;
    }

    return (
        <div className="p-8">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Welcome to {org.name}
                    </p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Project
                </Button>
            </header>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Placeholder stats */}
                {['Total Projects', 'Active Tasks', 'Completed', 'Team Members'].map((stat) => (
                    <div key={stat} className="p-6 rounded-xl border bg-card/50 backdrop-blur-sm shadow-sm">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">{stat}</h3>
                        <div className="text-2xl font-bold">0</div>
                    </div>
                ))}
            </div>

            <div className="mt-8 rounded-xl border bg-card/50 backdrop-blur-sm p-8 text-center">
                <h2 className="text-lg font-semibold mb-2">No projects yet</h2>
                <p className="text-muted-foreground mb-4">
                    Get started by creating your first project.
                </p>
                <Button variant="outline">Create Project</Button>
            </div>
        </div>
    );
}
