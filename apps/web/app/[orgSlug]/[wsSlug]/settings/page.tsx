'use client';

import { useState } from 'react';
import { useOrg } from '@/hooks/use-org';
import { useWorkspace } from '@/hooks/use-workspace';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Loader2, Save, Trash2 } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function WorkspaceSettingsPage() {
    const { org } = useOrg();
    const { workspace, isLoading } = useWorkspace();
    const [name, setName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const utils = trpc.useUtils();

    const updateWorkspace = trpc.workspace.update.useMutation({
        onSuccess: () => {
            utils.workspace.getBySlug.invalidate();
            setIsSaving(false);
        },
    });

    const deleteWorkspace = trpc.workspace.delete.useMutation({
        onSuccess: () => {
            window.location.href = `/${org?.slug}`;
        },
    });

    // Initialize form when workspace loads
    if (workspace && !name) {
        setName(workspace.name);
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!workspace) {
        return <div className="p-8">Workspace not found</div>;
    }

    const handleSave = () => {
        setIsSaving(true);
        updateWorkspace.mutate({
            id: workspace.id,
            name,
        });
    };

    const handleDelete = () => {
        deleteWorkspace.mutate({ id: workspace.id });
    };

    return (
        <div className="flex flex-col h-full p-6 space-y-6 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Workspace Settings</h1>
                <p className="text-muted-foreground text-sm">
                    Manage settings for {workspace.name}
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>General</CardTitle>
                    <CardDescription>Update your workspace details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="ws-name">Workspace Name</Label>
                        <Input
                            id="ws-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Workspace name"
                        />
                    </div>
                    <Button onClick={handleSave} disabled={isSaving || !name}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </CardContent>
            </Card>

            <Separator />

            <Card className="border-destructive/50">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Danger Zone
                    </CardTitle>
                    <CardDescription>
                        Irreversible actions that will permanently affect this workspace
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Workspace
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the workspace
                                    "{workspace.name}" and all associated projects and tasks.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
        </div>
    );
}
