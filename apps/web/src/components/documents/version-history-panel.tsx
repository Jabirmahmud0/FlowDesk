'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
    Clock,
    RotateCcw,
    Trash2,
    FileText,
    User,
    ChevronRight,
    CheckCircle2,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type VersionHistoryPanelProps = {
    orgId: string;
    documentId: string;
    onClose: () => void;
};

export function VersionHistoryPanel({ orgId, documentId, onClose }: VersionHistoryPanelProps) {
    const { toast } = useToast();
    const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
    const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
    const [versionToRestore, setVersionToRestore] = useState<{ id: string; versionNumber: number } | null>(null);

    const { data: versions, isLoading, refetch } = trpc.document.getVersions.useQuery(
        { orgId, documentId },
        { enabled: !!orgId && !!documentId }
    );

    const restoreMutation = trpc.document.restoreVersion.useMutation({
        onSuccess: () => {
            toast({
                title: 'Version restored',
                description: 'Document has been restored to the selected version.',
            });
            setRestoreDialogOpen(false);
            refetch();
        },
        onError: (err) => {
            toast({
                title: 'Error',
                description: err.message,
                variant: 'destructive',
            });
        },
    });

    const deleteMutation = trpc.document.deleteVersion.useMutation({
        onSuccess: () => {
            toast({ title: 'Version deleted' });
            refetch();
        },
        onError: (err) => {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        },
    });

    const handleRestore = (versionId: string, versionNumber: number) => {
        setVersionToRestore({ id: versionId, versionNumber });
        setRestoreDialogOpen(true);
    };

    const confirmRestore = () => {
        if (versionToRestore) {
            restoreMutation.mutate({ orgId, versionId: versionToRestore.id });
        }
    };

    const handleDelete = (versionId: string) => {
        if (confirm('Are you sure you want to delete this version?')) {
            deleteMutation.mutate({ orgId, versionId });
        }
    };

    return (
        <>
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b">
                    <div>
                        <h3 className="font-semibold">Version History</h3>
                        <p className="text-xs text-muted-foreground">
                            {versions?.length || 0} version{versions?.length !== 1 ? 's' : ''} available
                        </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        Close
                    </Button>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-3">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8 text-muted-foreground">
                                <Clock className="h-6 w-6 animate-spin mr-2" />
                                Loading versions...
                            </div>
                        ) : versions?.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p className="text-sm">No version history yet</p>
                                <p className="text-xs mt-1">Versions will be saved automatically when you update</p>
                            </div>
                        ) : (
                            versions?.map((version, index) => (
                                <div
                                    key={version.id}
                                    className={`relative rounded-lg border p-4 transition-all hover:shadow-md ${
                                        selectedVersion === version.id
                                            ? 'border-primary bg-primary/5'
                                            : 'bg-card'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div
                                            className="flex-1 cursor-pointer"
                                            onClick={() =>
                                                setSelectedVersion(selectedVersion === version.id ? null : version.id)
                                            }
                                        >
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant={index === 0 ? 'default' : 'secondary'}
                                                    className="text-xs"
                                                >
                                                    v{version.versionNumber}
                                                </Badge>
                                                {index === 0 && (
                                                    <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                                        Current
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="font-medium mt-2 text-sm">{version.title}</p>
                                            {version.changeNote && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {version.changeNote}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    {version.creator?.name || 'Unknown'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(version.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            {index > 0 && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-primary hover:text-primary"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRestore(version.id, version.versionNumber);
                                                    }}
                                                    disabled={restoreMutation.isPending}
                                                >
                                                    <RotateCcw className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {index > 0 && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(version.id);
                                                    }}
                                                    disabled={deleteMutation.isPending}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {selectedVersion === version.id && version.content !== null && version.content !== undefined && (
                                        <div className="mt-4 pt-4 border-t">
                                            <div className="flex items-center gap-2 mb-2">
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-xs font-medium text-muted-foreground">
                                                    Content Preview
                                                </span>
                                            </div>
                                            <div
                                                className="prose prose-sm dark:prose-invert max-w-none bg-muted/50 rounded-md p-3 text-xs"
                                                dangerouslySetInnerHTML={{
                                                    __html: typeof version.content === 'string'
                                                        ? version.content
                                                        : (version.content as any)?.html || '',
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Restore Confirmation Dialog */}
            <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Restore Version</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to restore version {versionToRestore?.versionNumber}?
                            This will create a new version with the restored content.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRestoreDialogOpen(false)}
                            disabled={restoreMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmRestore}
                            disabled={restoreMutation.isPending}
                        >
                            {restoreMutation.isPending ? (
                                <>
                                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                                    Restoring...
                                </>
                            ) : (
                                <>
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Restore Version
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
