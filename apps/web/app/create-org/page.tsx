'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Layout, ArrowRight } from 'lucide-react';

export default function CreateOrgPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');

    const createOrg = trpc.org.create.useMutation({
        onSuccess: (data) => {
            router.push(`/${data.slug}`);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createOrg.mutate({ name, slug });
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                        <Layout className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold">Create Organization</h1>
                    <p className="text-muted-foreground mt-2">
                        Organizations hold your projects and team members.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5" htmlFor="name">
                            Organization Name
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
                            placeholder="Acme Inc."
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5" htmlFor="slug">
                            Slug (URL)
                        </label>
                        <div className="flex items-center rounded-lg border bg-muted/50 px-3">
                            <span className="text-muted-foreground text-sm mr-1">flowdesk.app/</span>
                            <input
                                id="slug"
                                type="text"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                className="flex-1 bg-transparent py-2 text-sm outline-none"
                                placeholder="acme-inc"
                                required
                            />
                        </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={createOrg.isPending}>
                        {createOrg.isPending ? 'Creating...' : (
                            <>
                                Create Organization <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>

                    {createOrg.error && (
                        <p className="text-sm text-destructive text-center">
                            {createOrg.error.message}
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}
