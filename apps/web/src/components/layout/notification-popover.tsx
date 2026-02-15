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
import { ScrollArea } from '@/components/ui/scroll-area'; // Assuming we have or will use a scroll area
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useOrg } from '@/hooks/use-org';

export function NotificationPopover() {
    const { org } = useOrg();
    const [open, setOpen] = useState(false);

    // Polling could be added here or subscription
    const { data: unreadCount = 0 } = trpc.notification.getUnreadCount.useQuery(undefined, {
        refetchInterval: 30000 // Poll every 30s for now
    });

    const { data: notifications, refetch } = trpc.notification.list.useQuery(
        { orgId: org?.id, limit: 10 },
        { enabled: open && !!org?.id }
    );

    const utils = trpc.useUtils();

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
            case 'COMMENT_ADDED': return <MessageSquare className="h-4 w-4 text-green-500" />;
            case 'INVITE_RECEIVED': return <UserPlus className="h-4 w-4 text-purple-500" />;
            default: return <Bell className="h-4 w-4 text-gray-500" />;
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-600 ring-2 ring-background" />
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
                        >
                            Mark all read
                        </Button>
                    )}
                </div>
                {/* ScrollArea or just div with overflow */}
                <div className="max-h-[300px] overflow-y-auto">
                    {notifications?.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                            No notifications
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications?.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "p-4 flex gap-3 text-sm hover:bg-muted/50 transition-colors cursor-pointer",
                                        !notification.readAt && "bg-muted/20"
                                    )}
                                    onClick={() => {
                                        if (!notification.readAt) {
                                            markReadMutation.mutate({ id: notification.id });
                                        }
                                        // Here we could navigate to the task/page
                                    }}
                                >
                                    <div className="mt-1">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="font-medium leading-none">
                                            {notification.title}
                                        </p>
                                        <p className="text-muted-foreground text-xs line-clamp-2">
                                            {notification.body}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                    {!notification.readAt && (
                                        <div className="mt-1">
                                            <div className="h-2 w-2 rounded-full bg-blue-600" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
