'use client';

import { useWorkspace } from '@/hooks/use-workspace';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function WorkspaceDashboard() {
    const { workspace, isLoading } = useWorkspace();

    if (isLoading) {
        return <div className="p-8">Loading...</div>;
    }

    if (!workspace) {
        return <div className="p-8">Workspace not found</div>;
    }

    return (
        <div className="p-8">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">{workspace.name}</h1>
                    <p className="text-muted-foreground">
                        Workspace Overview
                    </p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Project
                </Button>
            </header>

            <div className="grid gap-4 md:grid-cols-3">
                {/* Project placeholders */}
                {workspace.projects.length === 0 ? (
                    <div className="col-span-full py-12 text-center border rounded-xl bg-card/50 border-dashed">
                        <p className="text-muted-foreground">No projects yet.</p>
                    </div>
                ) : (
                    workspace.projects.map((project: any) => (
                        <div key={project.id} className="p-6 rounded-xl border bg-card hover:border-primary/50 transition-colors cursor-pointer">
                            <h3 className="font-semibold mb-2">{project.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">{project.description || "No description"}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
