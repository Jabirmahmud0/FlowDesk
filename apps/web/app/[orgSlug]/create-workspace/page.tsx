'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Box, ArrowRight } from 'lucide-react';
import { useOrg } from '@/hooks/use-org';

export default function CreateWorkspacePage() {
    const router = useRouter();
    const { org, slug: orgSlug } = useOrg();
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');

    const createWorkspace = trpc.workspace.create.useMutation({
        onSuccess: (data) => {
            router.push(`/${orgSlug}/${data.slug}`);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!org) return;

        createWorkspace.mutate({
            name,
            slug,
            orgId: org.id
        });
    };

    if (!org) return <div className="p-8">Loading...</div>;

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                        <Box className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold">Create Workspace</h1>
                    <p className="text-muted-foreground mt-2">
                        Workspaces organize your projects within {org.name}.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5" htmlFor="name">
                            Workspace Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                // Simple slug generation
                                setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                            }}
                            className="w-full px-3 py-2 rounded-lg border bg-background"
                            placeholder="Engineering"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5" htmlFor="slug">
                            Slug
                        </label>
                        <div className="flex items-center rounded-lg border bg-muted/50 px-3">
                            <span className="text-muted-foreground text-sm mr-1">{orgSlug}/</span>
                            <input
                                id="slug"
                                type="text"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                className="flex-1 bg-transparent py-2 text-sm outline-none"
                                placeholder="engineering"
                                required
                            />
                        </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={createWorkspace.isPending}>
                        {createWorkspace.isPending ? 'Creating...' : (
                            <>
                                Create Workspace <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>

                    {createWorkspace.error && (
                        <p className="text-sm text-destructive text-center">
                            {createWorkspace.error.message}
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}
