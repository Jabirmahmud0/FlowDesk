'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Editor } from '@/components/ui/editor';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useOrg } from '@/hooks/use-org';

type Props = {
    taskId: string;
    projectId: string; // Passed for invalidation scope if needed, though simple invalidation works
};

export function CommentSection({ taskId, projectId }: Props) {
    const { org } = useOrg();
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const utils = trpc.useUtils();

    const { data: comments, isLoading } = trpc.comment.listByTask.useQuery(
        { orgId: org?.id!, taskId },
        { enabled: !!org?.id && !!taskId }
    );

    const createMutation = trpc.comment.create.useMutation({
        onSuccess: () => {
            setContent('');
            utils.comment.listByTask.invalidate({ taskId });
            setIsSubmitting(false);
        },
        onError: () => {
            setIsSubmitting(false);
        }
    });

    const handleSubmit = async () => {
        if (!content || content === '<p></p>') return;
        setIsSubmitting(true);
        createMutation.mutate({
            taskId,
            content: content // Sending HTML string
        });
    };

    if (isLoading) return <div className="text-sm text-muted-foreground">Loading comments...</div>;

    return (
        <div className="space-y-6">
            <h3 className="text-sm font-medium text-muted-foreground">Activity & Comments</h3>

            <div className="space-y-4">
                <div className="border rounded-md">
                    <Editor
                        value={content}
                        onChange={setContent}
                        placeholder="Write a comment..."
                        className="min-h-[100px] border-none focus-visible:ring-0"
                    />
                    <div className="flex justify-end p-2 border-t bg-muted/20">
                        <Button
                            size="sm"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !content || content === '<p></p>'}
                        >
                            {isSubmitting ? 'Posting...' : 'Comment'}
                        </Button>
                    </div>
                </div>

                <div className="space-y-4">
                    {comments?.map((comment) => (
                        <div key={comment.id} className="flex gap-3 text-sm">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={comment.user.image || ''} />
                                <AvatarFallback>{comment.user.name?.[0] || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">{comment.user.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                                <div
                                    className="prose prose-sm dark:prose-invert max-w-none text-foreground"
                                    dangerouslySetInnerHTML={{ __html: comment.content as string }}
                                />
                            </div>
                        </div>
                    ))}
                    {comments?.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No comments yet.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
