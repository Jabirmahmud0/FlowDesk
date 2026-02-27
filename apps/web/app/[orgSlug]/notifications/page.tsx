'use client';

import { useState } from 'react';
import { useOrg } from '@/hooks/use-org';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Bell,
    Check,
    CheckCheck,
    MessageSquare,
    UserPlus,
    FileText,
    Trash2,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    TASK_ASSIGNED: FileText,
    TASK_UPDATED: FileText,
    COMMENT_ADDED: MessageSquare,
    INVITE_RECEIVED: UserPlus,
    MENTION: MessageSquare,
    DUE_SOON: AlertCircle,
};

const typeColors: Record<string, string> = {
    TASK_ASSIGNED: 'bg-blue-500/10 text-blue-600',
    TASK_UPDATED: 'bg-amber-500/10 text-amber-600',
    COMMENT_ADDED: 'bg-green-500/10 text-green-600',
    INVITE_RECEIVED: 'bg-purple-500/10 text-purple-600',
    MENTION: 'bg-pink-500/10 text-pink-600',
    DUE_SOON: 'bg-red-500/10 text-red-600',
};

export default function NotificationsPage() {
    const { org } = useOrg();
    const { toast } = useToast();
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const utils = trpc.useUtils();

    const { data: notifications, isLoading, refetch } = trpc.notification.list.useQuery(
        { orgId: org?.id, limit: 100 },
        { enabled: !!org?.id }
    );

    const { data: unreadCount } = trpc.notification.getUnreadCount.useQuery();

    const markReadMutation = trpc.notification.markRead.useMutation({
        onSuccess: () => {
            utils.notification.getUnreadCount.invalidate();
            refetch();
        },
    });

    const markAllReadMutation = trpc.notification.markAllRead.useMutation({
        onSuccess: () => {
            toast({
                title: 'All marked as read',
                description: 'All notifications have been marked as read.',
            });
            utils.notification.getUnreadCount.invalidate();
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

    const deleteMutation = trpc.notification.delete.useMutation({
        onSuccess: () => {
            utils.notification.getUnreadCount.invalidate();
            refetch();
        },
    });

    const handleMarkRead = (id: string) => {
        markReadMutation.mutate({ id });
    };

    const handleDelete = (id: string) => {
        deleteMutation.mutate({ id });
    };

    const handleMarkAllRead = () => {
        markAllReadMutation.mutate({ orgId: org?.id });
    };

    const filteredNotifications = filter === 'unread'
        ? notifications?.filter((n) => !n.readAt)
        : notifications;

    const unreadNotifications = notifications?.filter((n) => !n.readAt) || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Notifications</h3>
                    <p className="text-sm text-muted-foreground">
                        Stay updated with your activities and mentions.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant={unreadNotifications.length > 0 ? 'default' : 'secondary'}>
                        {unreadNotifications.length} unread
                    </Badge>
                    {unreadNotifications.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleMarkAllRead}
                            disabled={markAllReadMutation.isPending}
                        >
                            {markAllReadMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCheck className="mr-2 h-4 w-4" />
                            )}
                            Mark all read
                        </Button>
                    )}
                </div>
            </div>

            <Separator />

            {/* Filters */}
            <div className="flex items-center gap-2">
                <Button
                    variant={filter === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter('all')}
                >
                    All
                </Button>
                <Button
                    variant={filter === 'unread' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter('unread')}
                >
                    Unread
                </Button>
            </div>

            {/* Notifications List */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        {filter === 'unread' ? 'Unread Notifications' : 'All Notifications'}
                    </CardTitle>
                    <CardDescription>
                        {filteredNotifications?.length || 0}{' '}
                        {filteredNotifications?.length === 1 ? 'notification' : 'notifications'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredNotifications?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <p className="text-muted-foreground">
                                {filter === 'unread'
                                    ? 'No unread notifications'
                                    : 'No notifications yet'}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {filter === 'unread'
                                    ? 'All caught up!'
                                    : "You'll see notifications here when people mention you, assign tasks, or add comments."}
                            </p>
                        </div>
                    ) : (
                        <ScrollArea className="h-[600px]">
                            <div className="space-y-2">
                                {filteredNotifications?.map((notification) => {
                                    const Icon = typeIcons[notification.type] || Bell;
                                    const colorClass = typeColors[notification.type] || 'bg-gray-500/10 text-gray-600';

                                    return (
                                        <div
                                            key={notification.id}
                                            className={cn(
                                                'group flex items-start gap-3 p-4 rounded-lg border transition-colors cursor-pointer',
                                                !notification.readAt
                                                    ? 'bg-muted/50 border-muted-foreground/20'
                                                    : 'bg-background'
                                            )}
                                            onClick={() => handleMarkRead(notification.id)}
                                        >
                                            {/* Icon */}
                                            <div className={cn('p-2 rounded-lg shrink-0', colorClass)}>
                                                <Icon className="h-4 w-4" />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <p className={cn(
                                                            'font-medium text-sm',
                                                            !notification.readAt && 'text-foreground'
                                                        )}>
                                                            {notification.title}
                                                        </p>
                                                        {notification.body && (
                                                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                                {notification.body}
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-muted-foreground mt-2">
                                                            {formatDistanceToNow(new Date(notification.createdAt), {
                                                                addSuffix: true,
                                                            })}
                                                        </p>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {!notification.readAt && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleMarkRead(notification.id);
                                                                }}
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Delete notification?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        This action cannot be undone.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => handleDelete(notification.id)}
                                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                    >
                                                                        Delete
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Unread indicator */}
                                            {!notification.readAt && (
                                                <div className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-2" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
