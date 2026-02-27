'use client';

import { useState, useEffect } from 'react';
import { useOrg } from '@/hooks/use-org';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Loader2, Save, Building2, Link as LinkIcon, Trash2 } from 'lucide-react';
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
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

export default function OrganizationSettingsPage() {
    const { org } = useOrg();
    const router = useRouter();
    const { toast } = useToast();
    
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const utils = trpc.useUtils();

    const updateOrgMutation = trpc.org.update.useMutation({
        onSuccess: (updatedOrg) => {
            toast({
                title: 'Organization updated',
                description: 'Your organization settings have been saved.',
            });
            // Redirect to the new slug URL
            if (updatedOrg.slug !== org?.slug) {
                window.location.href = `/${updatedOrg.slug}/settings`;
            } else {
                utils.org.getBySlug.invalidate({ slug: org?.slug });
                setIsSaving(false);
            }
        },
        onError: (err) => {
            toast({
                title: 'Error',
                description: err.message,
                variant: 'destructive',
            });
            setIsSaving(false);
        },
    });

    const deleteOrgMutation = trpc.org.delete.useMutation({
        onSuccess: () => {
            toast({
                title: 'Organization deleted',
                description: 'Your organization has been permanently deleted.',
            });
            router.push('/dashboard');
        },
        onError: (err) => {
            toast({
                title: 'Error',
                description: err.message,
                variant: 'destructive',
            });
            setIsDeleting(false);
        },
    });

    // Initialize form when org loads
    useEffect(() => {
        if (org) {
            setName(org.name);
            setSlug(org.slug);
        }
    }, [org]);

    const handleSave = () => {
        if (!org?.id) return;
        setIsSaving(true);
        updateOrgMutation.mutate({
            orgId: org.id,
            name,
            slug,
        });
    };

    const handleDelete = () => {
        if (!org?.id) return;
        setIsDeleting(true);
        deleteOrgMutation.mutate({ orgId: org.id });
    };

    if (!org) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const memberCount = org.members?.length || 0;
    const isOwner = org.members?.find((m: any) => m.userId === org.createdBy)?.role === 'OWNER';

    return (
        <div className="space-y-6">
            {/* General Settings */}
            <div>
                <h3 className="text-lg font-medium">General Information</h3>
                <p className="text-sm text-muted-foreground">
                    Update your organization's basic information.
                </p>
            </div>
            <Separator />
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Organization Details
                    </CardTitle>
                    <CardDescription>
                        Manage your organization name and identifier.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="org-name">Organization Name</Label>
                        <Input
                            id="org-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="My Organization"
                        />
                        <p className="text-xs text-muted-foreground">
                            The display name for your organization.
                        </p>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="org-slug">Organization Slug</Label>
                        <div className="flex gap-2">
                            <div className="flex items-center px-3 bg-muted rounded-md border border-input text-muted-foreground">
                                <span className="text-sm">{typeof window !== 'undefined' && window.location.origin}/</span>
                            </div>
                            <Input
                                id="org-slug"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                                placeholder="my-org"
                                className="flex-1"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Your unique identifier in URLs. Only lowercase letters, numbers, and hyphens.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                        <div className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">{memberCount}</span> member{memberCount !== 1 ? 's' : ''}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Created: {new Date(org.createdAt).toLocaleDateString()}
                        </div>
                    </div>

                    <Button 
                        onClick={handleSave} 
                        disabled={isSaving || !name || !slug}
                        className="mt-4"
                    >
                        {isSaving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        Save Changes
                    </Button>
                </CardContent>
            </Card>

            {/* Organization Stats */}
            <Card>
                <CardHeader>
                    <CardTitle>Organization Stats</CardTitle>
                    <CardDescription>
                        Overview of your organization's usage.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Members</p>
                            <p className="text-2xl font-bold">{memberCount}</p>
                            <p className="text-xs text-muted-foreground">
                                {org.plan === 'FREE' ? '5 max (Free)' : 'Unlimited'}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Plan</p>
                            <p className="text-2xl font-bold capitalize">{org.plan?.toLowerCase() || 'free'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Created</p>
                            <p className="text-lg font-bold">{new Date(org.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            {isOwner && (
                <>
                    <Separator />
                    <Card className="border-destructive/50">
                        <CardHeader>
                            <CardTitle className="text-destructive flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                Danger Zone
                            </CardTitle>
                            <CardDescription>
                                Irreversible actions that will permanently affect your organization
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                                    <div className="space-y-1">
                                        <p className="font-medium text-destructive">Delete Organization</p>
                                        <p className="text-sm text-muted-foreground">
                                            Permanently delete your organization and all associated data
                                        </p>
                                    </div>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button 
                                                variant="destructive"
                                                disabled={isDeleting || memberCount > 1}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete Organization
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription className="text-destructive">
                                                    This action cannot be undone. This will permanently delete:
                                                    <ul className="list-disc list-inside mt-2 space-y-1">
                                                        <li>All workspaces and projects</li>
                                                        <li>All tasks and comments</li>
                                                        <li>All documents and versions</li>
                                                        <li>All organization data</li>
                                                    </ul>
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction 
                                                    onClick={handleDelete} 
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    disabled={isDeleting}
                                                >
                                                    {isDeleting ? (
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                    )}
                                                    Delete Organization
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                                
                                {memberCount > 1 && (
                                    <p className="text-sm text-muted-foreground">
                                        You must remove all other members before deleting the organization.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
