'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { MessageSquare, Reply, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Comment {
    id: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    user: {
        id: string;
        name: string;
        avatarUrl?: string | null;
    };
    replies?: Comment[];
}

interface DocumentCommentsProps {
    comments: Comment[];
    onAddComment: (content: string, parentId?: string) => void;
    onEditComment: (commentId: string, content: string) => void;
    onDeleteComment: (commentId: string) => void;
    currentUserId: string;
}

export function DocumentComments({
    comments,
    onAddComment,
    onEditComment,
    onDeleteComment,
    currentUserId,
}: DocumentCommentsProps) {
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');

    const handleReply = (parentId: string, content: string) => {
        if (!content.trim()) return;
        onAddComment(content, parentId);
        setReplyingTo(null);
        setReplyContent('');
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                <h3 className="font-semibold">Comments ({comments.length})</h3>
            </div>

            <div className="space-y-4">
                {comments.map((comment) => (
                    <CommentThread
                        key={comment.id}
                        comment={comment}
                        onReply={(content) => handleReply(comment.id, content)}
                        onEdit={(content) => onEditComment(comment.id, content)}
                        onDelete={() => onDeleteComment(comment.id)}
                        replyingTo={replyingTo}
                        setReplyingTo={setReplyingTo}
                        replyContent={replyContent}
                        setReplyContent={setReplyContent}
                        currentUserId={currentUserId}
                        depth={0}
                    />
                ))}
            </div>
        </div>
    );
}

interface CommentThreadProps {
    comment: Comment;
    onReply: (content: string, parentId?: string) => void;
    onEdit: (content: string) => void;
    onDelete: () => void;
    replyingTo: string | null;
    setReplyingTo: (id: string | null) => void;
    replyContent: string;
    setReplyContent: (content: string) => void;
    currentUserId: string;
    depth: number;
}

function CommentThread({
    comment,
    onReply,
    onEdit,
    onDelete,
    replyingTo,
    setReplyingTo,
    replyContent,
    setReplyContent,
    currentUserId,
    depth,
}: CommentThreadProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const isReplying = replyingTo === comment.id;
    const isOwnComment = comment.user.id === currentUserId;
    const maxDepth = 3;

    const handleSaveEdit = () => {
        onEdit(editContent);
        setIsEditing(false);
    };

    return (
        <div className={cn(depth > 0 && 'ml-8 border-l-2 border-muted pl-4')}>
            <div className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={comment.user.avatarUrl || undefined} />
                    <AvatarFallback>
                        {comment.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-2">
                    {/* Comment Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{comment.user.name}</span>
                            <span className="text-xs text-muted-foreground">
                                {format(new Date(comment.createdAt), 'MMM d, yyyy HH:mm')}
                            </span>
                        </div>

                        {isOwnComment && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={onDelete}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>

                    {/* Comment Content */}
                    {isEditing ? (
                        <div className="space-y-2">
                            <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="min-h-[80px]"
                            />
                            <div className="flex gap-2">
                                <Button size="sm" onClick={handleSaveEdit}>
                                    Save
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditContent(comment.content);
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm">{comment.content}</p>
                    )}

                    {/* Reply Actions */}
                    {!isEditing && depth < maxDepth && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => setReplyingTo(isReplying ? null : comment.id)}
                            >
                                <Reply className="h-3 w-3 mr-1" />
                                Reply
                            </Button>
                        </div>
                    )}

                    {/* Reply Form */}
                    {isReplying && (
                        <div className="space-y-2 mt-2">
                            <Textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Write a reply..."
                                className="min-h-[80px]"
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    onClick={() => onReply(replyContent)}
                                    disabled={!replyContent.trim()}
                                >
                                    Reply
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setReplyingTo(null);
                                        setReplyContent('');
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Nested Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-3 space-y-3">
                            {comment.replies.map((reply) => (
                                <CommentThread
                                    key={reply.id}
                                    comment={reply}
                                    onReply={onReply}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    replyingTo={replyingTo}
                                    setReplyingTo={setReplyingTo}
                                    replyContent={replyContent}
                                    setReplyContent={setReplyContent}
                                    currentUserId={currentUserId}
                                    depth={depth + 1}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
