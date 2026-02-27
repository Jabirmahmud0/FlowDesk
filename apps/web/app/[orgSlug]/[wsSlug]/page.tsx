'use client';

import { useWorkspace } from '@/hooks/use-workspace';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { CreateProjectDialog } from '@/components/projects/create-project-dialog';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';

export default function WorkspaceDashboard() {
    const { workspace, isLoading } = useWorkspace();
    const [createOpen, setCreateOpen] = useState(false);
    const router = useRouter();
    const params = useParams();

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
                <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Project
                </Button>
            </header>

            <div className="grid gap-4 md:grid-cols-3">
                {workspace.projects.length === 0 ? (
                    <div className="col-span-full py-12 text-center border rounded-xl bg-card/50 border-dashed">
                        <p className="text-muted-foreground mb-4">No projects yet. Create your first project to get started.</p>
                        <Button variant="outline" onClick={() => setCreateOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Project
                        </Button>
                    </div>
                ) : (
                    workspace.projects.map((project: any) => (
                        <motion.div
                            key={project.id}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            onClick={() => router.push(`/${params.orgSlug}/${params.wsSlug}/board?project=${project.slug}`)}
                            className="p-6 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">{project.icon || '📁'}</span>
                                <h3 className="font-semibold">{project.name}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{project.description || "No description"}</p>
                        </motion.div>
                    ))
                )}
            </div>

            <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
        </div>
    );
}
