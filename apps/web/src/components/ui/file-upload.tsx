'use client';

import { useState, useRef } from 'react';
import { Upload, X, File, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

interface FileUploadProps {
    onUpload: (url: string, publicId: string) => void;
    accept?: string;
    maxSizeMB?: number;
    multiple?: boolean;
    className?: string;
}

export function FileUpload({
    onUpload,
    accept = 'image/*,.pdf,.doc,.docx,.txt',
    maxSizeMB = 10,
    multiple = false,
    className,
}: FileUploadProps) {
    const { toast } = useToast();
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (files: FileList | null) => {
        if (!files?.length) return;

        const file = files[0];

        // Validate file size
        if (file.size > maxSizeMB * 1024 * 1024) {
            toast({
                title: 'File too large',
                description: `Maximum file size is ${maxSizeMB}MB`,
                variant: 'destructive',
            });
            return;
        }

        setUploading(true);
        setProgress(0);

        try {
            // Create FormData for upload
            const formData = new FormData();
            formData.append('file', file);

            // Simulate upload progress
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 10, 90));
            }, 200);

            // Upload to Cloudinary
            const response = await uploadToCloudinary(formData);

            clearInterval(progressInterval);
            setProgress(100);

            onUpload(response.secure_url, response.public_id);

            toast({
                title: 'Upload successful',
                description: `${file.name} uploaded successfully`,
            });
        } catch (error) {
            toast({
                title: 'Upload failed',
                description: 'Failed to upload file. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setUploading(false);
            setProgress(0);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const uploadToCloudinary = async (formData: FormData): Promise<{ secure_url: string; public_id: string }> => {
        // Use the API endpoint for proper server-side upload
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || 'Upload failed');
        }

        return response.json();
    };

    const isImage = accept.includes('image');

    return (
        <div className={cn('space-y-4', className)}>
            <div
                className={cn(
                    'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                    uploading ? 'border-primary/50 bg-primary/5' : 'hover:border-primary cursor-pointer'
                )}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                    disabled={uploading}
                />

                {uploading ? (
                    <div className="space-y-4">
                        <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                        <p className="text-sm text-muted-foreground">Uploading...</p>
                        <Progress value={progress} className="w-full max-w-xs mx-auto" />
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="flex justify-center">
                            {isImage ? (
                                <ImageIcon className="h-10 w-10 text-muted-foreground" />
                            ) : (
                                <File className="h-10 w-10 text-muted-foreground" />
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-medium">
                                Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {accept.replace(/,/g, ', ').replace(/\*/g, 'files')} (max {maxSizeMB}MB)
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

interface FilePreviewProps {
    url: string;
    filename: string;
    onRemove?: () => void;
    className?: string;
}

export function FilePreview({ url, filename, onRemove, className }: FilePreviewProps) {
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);

    return (
        <div className={cn('relative group rounded-lg overflow-hidden border', className)}>
            {isImage ? (
                <Image src={url} alt={filename} className="w-full h-48 object-cover" />
            ) : (
                <div className="w-full h-48 flex items-center justify-center bg-muted">
                    <File className="h-12 w-12 text-muted-foreground" />
                </div>
            )}

            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => window.open(url, '_blank')}
                >
                    View
                </Button>
                {onRemove && (
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={onRemove}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white px-3 py-2">
                <p className="text-sm truncate">{filename}</p>
            </div>
        </div>
    );
}
