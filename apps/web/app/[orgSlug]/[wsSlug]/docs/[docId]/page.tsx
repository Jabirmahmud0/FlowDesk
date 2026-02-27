'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useOrg } from '@/hooks/use-org';
import { useWorkspace } from '@/hooks/use-workspace';
import { trpc } from '@/lib/trpc';
import { EnhancedEditor } from '@/components/ui/enhanced-editor';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
    ArrowLeft,
    Loader2,
    Save,
    Eye,
    Edit3,
    MoreHorizontal,
    Star,
    StarOff,
    Trash2,
    Clock,
    Users,
    FileText,
    Download,
    Copy,
    Share2,
    Settings,
    FileBadge,
    Bold,
    Italic,
    Underline,
    List,
    Heading1,
    History,
    MessageSquare,
} from 'lucide-react';
import Link from 'next/link';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VersionHistoryPanel } from '@/components/documents/version-history-panel';
import { DocumentCommentPanel } from '@/components/documents/document-comment-panel';

type EditorMode = 'edit' | 'view';

export default function DocumentPage() {
    const params = useParams();
    const router = useRouter();
    const { org } = useOrg();
    const { workspace } = useWorkspace();
    const { toast } = useToast();

    const docId = params.docId as string;
    const orgSlug = params.orgSlug as string;
    const wsSlug = params.wsSlug as string;

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [mode, setMode] = useState<EditorMode>('edit');
    const [isStarred, setIsStarred] = useState(false);
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [shareEmail, setShareEmail] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
    const [commentsOpen, setCommentsOpen] = useState(false);

    const utils = trpc.useUtils();

    const { data: doc, isLoading, refetch } = trpc.document.get.useQuery(
        { orgId: org?.id!, id: docId },
        {
            enabled: !!org?.id && !!docId,
        }
    );

    useEffect(() => {
        if (doc) {
            setTitle(doc.title);
            const docContent = typeof doc.content === 'string'
                ? doc.content
                : (doc.content as { html?: string })?.html || '';
            setContent(docContent);
        }
    }, [doc]);

    const updateMutation = trpc.document.update.useMutation({
        onSuccess: () => {
            toast({
                title: 'Document saved successfully',
                description: 'Your changes have been saved.',
            });
            refetch();
            utils.document.get.invalidate({ id: docId });
            utils.document.list.invalidate();
        },
        onError: (err) => {
            toast({
                title: 'Error saving document',
                description: err.message,
                variant: 'destructive',
            });
        },
    });

    const deleteMutation = trpc.document.delete.useMutation({
        onSuccess: () => {
            toast({ title: 'Document deleted' });
            router.push(`/${orgSlug}/${wsSlug}/docs`);
        },
        onError: (err) => {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        },
    });

    const handleSave = () => {
        if (!org?.id) return;
        updateMutation.mutate({
            orgId: org.id,
            id: docId,
            title,
            content,
        });
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this document?')) {
            deleteMutation.mutate({ id: docId });
        }
    };

    const copyToClipboard = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        toast({ title: 'Link copied', description: 'Document link copied to clipboard' });
    };

    const handleShare = () => {
        // TODO: Implement share functionality
        toast({ title: 'Share feature', description: 'This feature is coming soon!' });
        setShareDialogOpen(false);
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading document...</p>
                </div>
            </div>
        );
    }

    if (!doc) {
        return (
            <div className="flex h-full flex-col items-center justify-center space-y-4">
                <FileText className="h-16 w-16 text-muted-foreground" />
                <div className="text-center">
                    <h2 className="text-2xl font-semibold">Document not found</h2>
                    <p className="text-muted-foreground mt-1">This document doesn't exist or has been deleted.</p>
                </div>
                <Button variant="outline" asChild>
                    <Link href={`/${orgSlug}/${wsSlug}/docs`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Documents
                    </Link>
                </Button>
            </div>
        );
    }

    const collaborators = [
        { id: '1', name: 'John Doe', color: '#3b82f6' },
        { id: '2', name: 'Jane Smith', color: '#ec4899' },
        { id: '3', name: 'Bob Wilson', color: '#10b981' },
    ];

    const documentInfo = {
        created: new Date(doc.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }),
        updated: new Date(doc.updatedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }),
        wordCount: content.replace(/<[^>]*>/g, '').split(/\s+/).filter((w) => w.length > 0).length,
        charCount: content.replace(/<[^>]*>/g, '').length,
    };

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-background to-muted/20">
            {/* Modern Header */}
            <header className="flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-3 sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="hover:bg-muted transition-colors"
                    >
                        <Link href={`/${orgSlug}/${wsSlug}/docs`}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
                            <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="text-lg font-semibold border-none bg-transparent hover:bg-muted/50 focus-visible:ring-1 px-2 py-1 h-auto"
                                placeholder="Document Title"
                            />
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                <Badge variant="secondary" className="text-[10px] h-4">
                                    {mode === 'edit' ? 'Editing' : 'Viewing'}
                                </Badge>
                                <span>{documentInfo.wordCount} words</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Mode Toggle */}
                    <div className="flex items-center gap-1 bg-muted rounded-lg p-1 mr-2">
                        <Button
                            variant={mode === 'edit' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setMode('edit')}
                            className="h-7 gap-1.5 text-xs"
                        >
                            <Edit3 className="h-3.5 w-3.5" />
                            Edit
                        </Button>
                        <Button
                            variant={mode === 'view' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setMode('view')}
                            className="h-7 gap-1.5 text-xs"
                        >
                            <Eye className="h-3.5 w-3.5" />
                            View
                        </Button>
                    </div>

                    {/* Collaborators */}
                    <div className="hidden md:flex -space-x-2 mr-4">
                        {collaborators.map((c, i) => (
                            <div
                                key={c.id}
                                className="w-7 h-7 rounded-full border-2 border-background flex items-center justify-center text-xs font-medium text-white cursor-pointer hover:scale-110 transition-transform"
                                style={{ backgroundColor: c.color }}
                                title={c.name}
                            >
                                {c.name.charAt(0)}
                            </div>
                        ))}
                        <div className="w-7 h-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium cursor-pointer hover:scale-110 transition-transform">
                            <Users className="h-3 w-3" />
                        </div>
                    </div>

                    {/* Last Saved */}
                    <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground mr-4 px-3 py-1.5 bg-muted/50 rounded-full">
                        {updateMutation.isPending ? (
                            <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Clock className="h-3 w-3" />
                                Updated {new Date(doc.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </>
                        )}
                    </div>

                    {/* Comments Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCommentsOpen(true)}
                        className="gap-2 hidden sm:flex"
                    >
                        <MessageSquare className="h-4 w-4" />
                        <span className="hidden lg:inline">Comments</span>
                    </Button>

                    {/* Star Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsStarred(!isStarred)}
                        className="text-muted-foreground hover:text-yellow-500"
                    >
                        {isStarred ? (
                            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        ) : (
                            <StarOff className="h-4 w-4" />
                        )}
                    </Button>

                    {/* Share Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShareDialogOpen(true)}
                        className="gap-2 hidden sm:flex"
                    >
                        <Share2 className="h-4 w-4" />
                        Share
                    </Button>

                    {/* Save Button */}
                    <Button
                        onClick={handleSave}
                        disabled={updateMutation.isPending || mode === 'view'}
                        className="gap-2"
                    >
                        {updateMutation.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                <span className="hidden sm:inline">Save</span>
                            </>
                        )}
                    </Button>

                    {/* More Actions */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Document Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={copyToClipboard}>
                                <Copy className="mr-2 h-4 w-4" /> Copy Link
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setVersionHistoryOpen(true)}>
                                <History className="mr-2 h-4 w-4" /> Version History
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSidebarOpen(true)}>
                                <FileBadge className="mr-2 h-4 w-4" /> Document Info
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Document
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Editor Container */}
                <div className="flex-1 overflow-auto">
                    <div className="min-h-full">
                        <EnhancedEditor
                            value={content}
                            onChange={setContent}
                            mode={mode}
                            placeholder="Start writing your document..."
                            onSave={handleSave}
                            isSaving={updateMutation.isPending}
                            lastSaved={doc?.updatedAt}
                            collaborators={collaborators}
                            className="max-w-4xl mx-auto"
                        />
                    </div>
                </div>

                {/* Document Info Sidebar */}
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                    <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                        <SheetHeader>
                            <SheetTitle>Document Information</SheetTitle>
                            <SheetDescription>
                                Details and metadata about this document.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="mt-6 space-y-6">
                            {/* Preview Card */}
                            <div className="rounded-lg border bg-card p-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 shrink-0">
                                        <FileText className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold truncate">{doc.title}</h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {documentInfo.wordCount} words · {documentInfo.charCount} characters
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-4">
                                <h4 className="font-medium text-sm">Details</h4>
                                <div className="grid gap-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Created</span>
                                        <span className="font-medium">{documentInfo.created}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Last Updated</span>
                                        <span className="font-medium">{documentInfo.updated}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Workspace</span>
                                        <span className="font-medium">{workspace?.name || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Organization</span>
                                        <span className="font-medium">{org?.name || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Activity */}
                            <div className="space-y-4">
                                <h4 className="font-medium text-sm">Activity</h4>
                                <div className="rounded-lg border bg-muted/50 p-4">
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                            <Clock className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Document updated</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(doc.updatedAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="space-y-4">
                                <h4 className="font-medium text-sm">Quick Actions</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            navigator.clipboard.writeText(content.replace(/<[^>]*>/g, ''));
                                            toast({ title: 'Copied', description: 'Text copied to clipboard' });
                                        }}
                                    >
                                        <Copy className="mr-2 h-4 w-4" />
                                        Copy Text
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setMode(mode === 'edit' ? 'view' : 'edit')}
                                    >
                                        {mode === 'edit' ? (
                                            <>
                                                <Eye className="mr-2 h-4 w-4" />
                                                View Mode
                                            </>
                                        ) : (
                                            <>
                                                <Edit3 className="mr-2 h-4 w-4" />
                                                Edit Mode
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Share Dialog */}
            <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Share Document</DialogTitle>
                        <DialogDescription>
                            Share this document with others by sending them a link or inviting them via email.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                            <Input
                                value={window.location.href}
                                readOnly
                                className="bg-background"
                            />
                            <Button
                                size="icon"
                                variant="outline"
                                onClick={copyToClipboard}
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="space-y-2">
                            <Label>Invite by email</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="colleague@example.com"
                                    value={shareEmail}
                                    onChange={(e) => setShareEmail(e.target.value)}
                                />
                                <Button onClick={handleShare}>Invite</Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Version History Sheet */}
            <Sheet open={versionHistoryOpen} onOpenChange={setVersionHistoryOpen}>
                <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0">
                    {org?.id && (
                        <VersionHistoryPanel
                            orgId={org.id}
                            documentId={docId}
                            onClose={() => setVersionHistoryOpen(false)}
                        />
                    )}
                </SheetContent>
            </Sheet>

            {/* Comments Sheet */}
            <Sheet open={commentsOpen} onOpenChange={setCommentsOpen}>
                <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0">
                    {org?.id && (
                        <DocumentCommentPanel
                            orgId={org.id}
                            documentId={docId}
                            onClose={() => setCommentsOpen(false)}
                        />
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
