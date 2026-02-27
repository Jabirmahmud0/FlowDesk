'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { useOrg } from '@/hooks/use-org';
import { Paperclip, Upload, Trash2, FileText, Image, Loader2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttachmentPanelProps {
    taskId: string;
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(filename: string) {
    const ext = filename.split('.').pop()?.toLowerCase();
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    if (imageExts.includes(ext || '')) return Image;
    return FileText;
}

export function AttachmentPanel({ taskId }: AttachmentPanelProps) {
    const { org } = useOrg();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const utils = trpc.useUtils();

    const { data: attachments, isLoading } = trpc.attachment.listByTask.useQuery(
        { orgId: org?.id!, taskId },
        { enabled: !!org?.id && !!taskId }
    );

    const createAttachment = trpc.attachment.create.useMutation({
        onSuccess: () => utils.attachment.listByTask.invalidate({ taskId }),
    });

    const deleteAttachment = trpc.attachment.delete.useMutation({
        onSuccess: () => utils.attachment.listByTask.invalidate({ taskId }),
    });

    const uploadFile = useCallback(async (file: File) => {
        if (!org?.id) return;
        setUploading(true);
        setUploadError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || 'Upload failed');
            }

            const result = await response.json();

            await createAttachment.mutateAsync({
                orgId: org.id,
                taskId,
                url: result.url,
                publicId: result.publicId,
                filename: result.filename,
                size: result.size,
            });
        } catch (err: any) {
            setUploadError(err.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    }, [org?.id, taskId, createAttachment]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadFile(file);
        // Reset so same file can be selected again
        e.target.value = '';
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) uploadFile(file);
    }, [uploadFile]);

    const handleDelete = async (id: string) => {
        if (!org?.id) return;
        await deleteAttachment.mutateAsync({ orgId: org.id, id });
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Attachments
                    {attachments && attachments.length > 0 && (
                        <span className="text-xs text-muted-foreground font-normal">
                            ({attachments.length})
                        </span>
                    )}
                </h4>
                <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                >
                    {uploading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    ) : (
                        <Upload className="h-3.5 w-3.5 mr-1" />
                    )}
                    {uploading ? 'Uploading...' : 'Upload'}
                </Button>
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept="image/*,.pdf,.txt,.csv,.zip,.docx,.xlsx"
            />

            {/* Drag-and-drop zone */}
            <div
                className={cn(
                    'border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer',
                    dragOver
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-muted-foreground/50',
                )}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <Upload className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                    Drop file or <span className="text-primary">click to browse</span>
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Max 10MB</p>
            </div>

            {/* Error */}
            {uploadError && (
                <p className="text-xs text-destructive">{uploadError}</p>
            )}

            {/* Attachment list */}
            {isLoading ? (
                <div className="flex justify-center py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
            ) : attachments && attachments.length > 0 ? (
                <div className="space-y-1.5">
                    {attachments.map((att: any) => {
                        const FileIcon = getFileIcon(att.filename);
                        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(
                            att.filename.split('.').pop()?.toLowerCase() || ''
                        );

                        return (
                            <div
                                key={att.id}
                                className="flex items-center gap-2 p-2 rounded-md border bg-card hover:bg-accent/50 group transition-colors"
                            >
                                {isImage ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={att.url}
                                        alt={att.filename}
                                        className="h-8 w-8 object-cover rounded flex-shrink-0"
                                    />
                                ) : (
                                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                                        <FileIcon className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium truncate">{att.filename}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                        {formatBytes(att.size)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a
                                        href={att.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1 rounded hover:bg-accent"
                                        title="Open"
                                    >
                                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                                    </a>
                                    <button
                                        onClick={() => handleDelete(att.id)}
                                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                        title="Delete"
                                        disabled={deleteAttachment.isPending}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-xs text-muted-foreground text-center py-2">
                    No attachments yet
                </p>
            )}
        </div>
    );
}
