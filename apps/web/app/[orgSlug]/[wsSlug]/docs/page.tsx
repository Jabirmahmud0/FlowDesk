'use client';

import { useOrg } from '@/hooks/use-org';
import { useWorkspace } from '@/hooks/use-workspace';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Loader2, MoreHorizontal, Pencil, Trash } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Label } from '@/components/ui/label';

export default function DocsPage() {
    const { org } = useOrg();
    const { workspace, isLoading: isWorkspaceLoading } = useWorkspace();
    const router = useRouter();
    const { toast } = useToast();
    const utils = trpc.useUtils();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newDocTitle, setNewDocTitle] = useState('');

    const { data: docs, isLoading: isDocsLoading } = trpc.document.list.useQuery(
        { orgId: org?.id!, workspaceId: workspace?.id! },
        { enabled: !!org?.id && !!workspace?.id }
    );

    const createMutation = trpc.document.create.useMutation({
        onSuccess: (doc) => {
            toast({ title: 'Document created', description: 'Redirecting to editor...' });
            setIsCreateOpen(false);
            setNewDocTitle('');
            utils.document.list.invalidate();
            router.push(`/${org!.slug}/${workspace!.slug}/docs/${doc.id}`);
        },
        onError: (err) => {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        }
    });

    const deleteMutation = trpc.document.delete.useMutation({
        onSuccess: () => {
            toast({ title: 'Document deleted' });
            utils.document.list.invalidate();
        },
        onError: (err) => {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        }
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDocTitle.trim()) return;
        createMutation.mutate({
            orgId: org!.id,
            workspaceId: workspace!.id,
            title: newDocTitle,
        });
    };

    if (isWorkspaceLoading) return <div className="p-8">Loading...</div>;
    if (!workspace) return <div className="p-8">Workspace not found</div>;

    return (
        <div className="flex flex-col h-full p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
                    <p className="text-muted-foreground text-sm">
                        Manage knowledge base and documentation.
                    </p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Document
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Document</DialogTitle>
                            <DialogDescription>
                                Give your new document a title.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate}>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="title" className="text-right">
                                        Title
                                    </Label>
                                    <Input
                                        id="title"
                                        value={newDocTitle}
                                        onChange={(e) => setNewDocTitle(e.target.value)}
                                        className="col-span-3"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={createMutation.isPending}>
                                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {isDocsLoading ? (
                <div className="p-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {docs?.length === 0 && (
                        <div className="col-span-full text-center p-12 border-2 border-dashed rounded-lg text-muted-foreground">
                            No documents yet. Create one to get started.
                        </div>
                    )}
                    {docs?.map((doc) => (
                        <div key={doc.id} className="group relative flex flex-col justify-between rounded-lg border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
                            <div className="space-y-2">
                                <div className="flex items-start justify-between">
                                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="-mr-2 -mt-2 h-8 w-8 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => toast({ title: "Edit not implemented" })}>
                                                <Pencil className="mr-2 h-4 w-4" /> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive"
                                                onClick={() => deleteMutation.mutate({ id: doc.id })}
                                            >
                                                <Trash className="mr-2 h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <h3 className="font-semibold leading-none tracking-tight">{doc.title}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                    {/* Parse content snippet if possible, else generic text */}
                                    Last updated {new Date(doc.updatedAt).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="mt-4">
                                <Button
                                    variant="secondary"
                                    className="w-full"
                                    onClick={() => router.push(`/${org!.slug}/${workspace!.slug}/docs/${doc.id}`)}
                                >
                                    Open
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
