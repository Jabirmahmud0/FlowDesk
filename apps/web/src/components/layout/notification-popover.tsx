'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Bell, Check, MessageSquare, UserPlus, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useOrg } from '@/hooks/use-org';
import { useSocket } from '@/components/providers/socket-provider';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export function NotificationPopover() {
    const { org } = useOrg();
    const router = useRouter();
    const socket = useSocket();
    const [open, setOpen] = useState(false);
    const utils = trpc.useUtils();

    // Always fetch unread count when org is available
    const { data: unreadCount = 0, refetch: refetchUnread } = trpc.notification.getUnreadCount.useQuery(
        undefined,
        { 
            enabled: !!org?.id,
            refetchInterval: 30000 // Poll every 30 seconds
        }
    );

    // Fetch notifications when popover opens
    const { data: notifications, refetch, isLoading } = trpc.notification.list.useQuery(
        { orgId: org?.id, limit: 10 },
        { 
            enabled: open && !!org?.id,
            staleTime: 5000 // Consider data fresh for 5 seconds
        }
    );

    // Real-time listener for notifications
    useEffect(() => {
        if (!socket) return;

        const handleNotification = (data: any) => {
            console.log('[Notification] Received real-time notification:', data);
            // Invalidate both queries to refresh
            utils.notification.getUnreadCount.invalidate();
            if (open) {
                utils.notification.list.invalidate();
            }
            refetchUnread();
        };

        socket.on('NOTIFICATION', handleNotification);

        return () => {
            socket.off('NOTIFICATION', handleNotification);
        };
    }, [socket, utils, open, refetchUnread]);

    const markReadMutation = trpc.notification.markRead.useMutation({
        onSuccess: () => {
            utils.notification.getUnreadCount.invalidate();
            refetch();
        }
    });

    const markAllReadMutation = trpc.notification.markAllRead.useMutation({
        onSuccess: () => {
            utils.notification.getUnreadCount.invalidate();
            refetch();
        }
    });

    const getIcon = (type: string) => {
        switch (type) {
            case 'TASK_ASSIGNED': return <FileText className="h-4 w-4 text-blue-500" />;
            case 'TASK_UPDATED': return <FileText className="h-4 w-4 text-amber-500" />;
            case 'COMMENT_ADDED': return <MessageSquare className="h-4 w-4 text-green-500" />;
            case 'INVITE_RECEIVED': return <UserPlus className="h-4 w-4 text-purple-500" />;
            case 'MENTION': return <MessageSquare className="h-4 w-4 text-pink-500" />;
            default: return <Bell className="h-4 w-4 text-gray-500" />;
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-background animate-pulse" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-auto p-1"
                            onClick={() => markAllReadMutation.mutate({ orgId: org?.id })}
                            disabled={markAllReadMutation.isPending}
                        >
                            {markAllReadMutation.isPending ? '...' : 'Mark all read'}
                        </Button>
                    )}
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                    {isLoading ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                            Loading...
                        </div>
                    ) : notifications?.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            No notifications
                        </div>
                    ) : (
                        <div className="divide-y">
                            <AnimatePresence>
                                {notifications?.map((notification, i) => (
                                    <motion.div
                                        key={notification.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2, delay: i * 0.04, type: 'spring', stiffness: 300, damping: 25 }}
                                        className={cn(
                                            "p-4 flex gap-3 text-sm hover:bg-muted/50 transition-colors cursor-pointer",
                                            !notification.readAt && "bg-muted/30"
                                        )}
                                        onClick={() => {
                                            if (!notification.readAt) {
                                                markReadMutation.mutate({ id: notification.id });
                                            }
                                        }}
                                    >
                                        <div className="mt-1 shrink-0">
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <p className="font-medium leading-none truncate">
                                                {notification.title}
                                            </p>
                                            {notification.body && (
                                                <p className="text-muted-foreground text-xs line-clamp-2">
                                                    {notification.body}
                                                </p>
                                            )}
                                            <p className="text-[10px] text-muted-foreground">
                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                        {!notification.readAt && (
                                            <motion.div
                                                className="mt-1 shrink-0"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                                            >
                                                <div className="h-2 w-2 rounded-full bg-blue-600" />
                                            </motion.div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
