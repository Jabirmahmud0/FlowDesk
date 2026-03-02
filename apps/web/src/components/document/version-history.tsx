'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { History, RotateCcw, Trash2, FileText, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface DocumentVersion {
    id: string;
    title: string;
    content?: any;
    changeNote?: string | null;
    createdAt: Date;
    createdBy: {
        id: string;
        name: string;
    };
}

interface DocumentVersionHistoryProps {
    versions: DocumentVersion[];
    currentVersionId?: string;
    onRestore: (versionId: string) => void;
    onDelete?: (versionId: string) => void;
}

export function DocumentVersionHistory({
    versions,
    currentVersionId,
    onRestore,
    onDelete,
}: DocumentVersionHistoryProps) {
    const [open, setOpen] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                        <History className="h-4 w-4 mr-2" />
                        History
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Version History</DialogTitle>
                        <DialogDescription>
                            View and restore previous versions of this document
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="h-[400px]">
                        <div className="space-y-2">
                            {versions.map((version, index) => (
                                <div
                                    key={version.id}
                                    className={cn(
                                        'p-4 border rounded-lg transition-colors',
                                        version.id === currentVersionId
                                            ? 'bg-primary/5 border-primary'
                                            : 'hover:bg-muted'
                                    )}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <FileText className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-medium">{version.title}</h4>
                                                    {version.id === currentVersionId && (
                                                        <Badge variant="default" className="text-xs">
                                                            Current
                                                        </Badge>
                                                    )}
                                                    {index === 0 && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            Latest
                                                        </Badge>
                                                    )}
                                                </div>
                                                {version.changeNote && (
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {version.changeNote}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <User className="h-3 w-3" />
                                                        {version.createdBy.name}
                                                    </div>
                                                    <div>
                                                        {format(new Date(version.createdAt), 'MMM d, yyyy HH:mm')}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <History className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => setSelectedVersion(version)}
                                                >
                                                    <FileText className="h-4 w-4 mr-2" />
                                                    View
                                                </DropdownMenuItem>
                                                {version.id !== currentVersionId && (
                                                    <DropdownMenuItem
                                                        onClick={() => onRestore(version.id)}
                                                    >
                                                        <RotateCcw className="h-4 w-4 mr-2" />
                                                        Restore
                                                    </DropdownMenuItem>
                                                )}
                                                {onDelete && index > 0 && (
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => onDelete(version.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Version Dialog */}
            <Dialog open={!!selectedVersion} onOpenChange={() => setSelectedVersion(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedVersion?.title}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedVersion && format(new Date(selectedVersion.createdAt), 'MMM d, yyyy HH:mm')} by{' '}
                            {selectedVersion?.createdBy.name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="border rounded-lg p-4 bg-muted/50 max-h-[400px] overflow-auto">
                        <pre className="text-sm whitespace-pre-wrap">
                            {selectedVersion?.changeNote || 'No change note'}
                        </pre>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedVersion(null)}>
                            Close
                        </Button>
                        {selectedVersion && (
                            <Button
                                onClick={() => {
                                    onRestore(selectedVersion.id);
                                    setSelectedVersion(null);
                                }}
                            >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Restore This Version
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
