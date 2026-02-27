'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
    MessageSquare,
    Send,
    CheckCircle2,
    Circle,
    Trash2,
    Reply,
    X,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type DocumentCommentPanelProps = {
    orgId: string;
    documentId: string;
    onClose?: () => void;
};

export function DocumentCommentPanel({ orgId, documentId, onClose }: DocumentCommentPanelProps) {
    const { toast } = useToast();
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');

    const { data: comments, isLoading, refetch } = trpc.document.getComments.useQuery(
        { orgId, documentId },
        { enabled: !!orgId && !!documentId }
    );

    const createMutation = trpc.document.createComment.useMutation({
        onSuccess: () => {
            toast({ title: 'Comment added' });
            setNewComment('');
            refetch();
        },
        onError: (err) => {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        },
    });

    const createReplyMutation = trpc.document.createComment.useMutation({
        onSuccess: () => {
            toast({ title: 'Reply added' });
            setReplyContent('');
            setReplyingTo(null);
            refetch();
        },
        onError: (err) => {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        },
    });

    const resolveMutation = trpc.document.updateComment.useMutation({
        onSuccess: () => {
            toast({ title: 'Comment resolved' });
            refetch();
        },
        onError: (err) => {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        },
    });

    const deleteMutation = trpc.document.deleteComment.useMutation({
        onSuccess: () => {
            toast({ title: 'Comment deleted' });
            refetch();
        },
        onError: (err) => {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        },
    });

    const handleAddComment = () => {
        if (!newComment.trim()) return;
        createMutation.mutate({
            orgId,
            documentId,
            content: newComment.trim(),
            parentId: null,
        });
    };

    const handleAddReply = (parentId: string) => {
        if (!replyContent.trim()) return;
        createReplyMutation.mutate({
            orgId,
            documentId,
            content: replyContent.trim(),
            parentId,
        });
    };

    const handleResolve = (commentId: string, isResolved: boolean) => {
        resolveMutation.mutate({
            orgId,
            id: commentId,
            resolved: !isResolved,
        });
    };

    const handleDelete = (commentId: string) => {
        if (confirm('Are you sure you want to delete this comment?')) {
            deleteMutation.mutate({ orgId, id: commentId });
        }
    };

    const totalComments = (comments || []).reduce(
        (acc, c: any) => acc + 1 + (c.replies?.length || 0),
        0
    );

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <div>
                    <h3 className="font-semibold flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Comments
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        {totalComments} {totalComments === 1 ? 'comment' : 'comments'}
                    </p>
                </div>
                {onClose && (
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Comments List */}
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8 text-muted-foreground">
                            Loading comments...
                        </div>
                    ) : comments?.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">No comments yet</p>
                            <p className="text-xs mt-1">Start a discussion about this document</p>
                        </div>
                    ) : (
                        comments?.map((comment) => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                onReply={handleAddReply}
                                onResolve={handleResolve}
                                onDelete={handleDelete}
                                replyingTo={replyingTo}
                                replyContent={replyContent}
                                setReplyingTo={setReplyingTo}
                                setReplyContent={setReplyContent}
                                isResolving={resolveMutation.isPending}
                                isDeleting={deleteMutation.isPending}
                            />
                        ))
                    )}
                </div>
            </ScrollArea>

            {/* Add Comment */}
            <div className="p-4 border-t bg-background">
                <div className="space-y-2">
                    <Textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[80px] resize-none"
                    />
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                            {newComment.length}/5000 characters
                        </p>
                        <Button
                            onClick={handleAddComment}
                            disabled={!newComment.trim() || createMutation.isPending}
                            size="sm"
                        >
                            {createMutation.isPending ? (
                                'Adding...'
                            ) : (
                                <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Comment
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

type CommentItemProps = {
    comment: any;
    onReply: (parentId: string, content: string) => void;
    onResolve: (commentId: string, isResolved: boolean) => void;
    onDelete: (commentId: string) => void;
    replyingTo: string | null;
    replyContent: string;
    setReplyingTo: (id: string | null) => void;
    setReplyContent: (content: string) => void;
    isResolving: boolean;
    isDeleting: boolean;
};

function CommentItem({
    comment,
    onReply,
    onResolve,
    onDelete,
    replyingTo,
    replyContent,
    setReplyingTo,
    setReplyContent,
    isResolving,
    isDeleting,
}: CommentItemProps) {
    const isResolved = !!comment.resolvedAt;

    return (
        <div className={cn('space-y-3', isResolved && 'opacity-60')}>
            <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.user.avatarUrl || undefined} />
                    <AvatarFallback>
                        {comment.user.name?.charAt(0) || comment.user.email?.charAt(0) || '?'}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{comment.user.name || 'Anonymous'}</span>
                        <span className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleString()}
                        </span>
                        {isResolved && (
                            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Resolved
                            </Badge>
                        )}
                    </div>
                    <p className="text-sm">{comment.content}</p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setReplyingTo(comment.id)}
                        >
                            <Reply className="h-3 w-3 mr-1" />
                            Reply
                        </Button>
                        {!isResolved && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => onResolve(comment.id, true)}
                                disabled={isResolving}
                            >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Resolve
                            </Button>
                        )}
                        {isResolved && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => onResolve(comment.id, false)}
                                disabled={isResolving}
                            >
                                <Circle className="h-3 w-3 mr-1" />
                                Reopen
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-destructive hover:text-destructive"
                            onClick={() => onDelete(comment.id)}
                            disabled={isDeleting}
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>

                    {/* Reply Input */}
                    {replyingTo === comment.id && (
                        <div className="mt-2 space-y-2">
                            <Textarea
                                placeholder="Write a reply..."
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                className="min-h-[60px] resize-none text-sm"
                                autoFocus
                            />
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    onClick={() => onReply(comment.id, replyContent)}
                                    disabled={!replyContent.trim()}
                                    className="h-7"
                                >
                                    <Send className="h-3 w-3 mr-1" />
                                    Reply
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                        setReplyingTo(null);
                                        setReplyContent('');
                                    }}
                                    className="h-7"
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-3 space-y-3 pl-4 border-l-2 border-muted">
                            {comment.replies.map((reply: any) => (
                                <div key={reply.id} className="flex gap-2">
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={reply.user.avatarUrl || undefined} />
                                        <AvatarFallback className="text-xs">
                                            {reply.user.name?.charAt(0) || reply.user.email?.charAt(0) || '?'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm">
                                                {reply.user.name || 'Anonymous'}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(reply.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-sm">{reply.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
