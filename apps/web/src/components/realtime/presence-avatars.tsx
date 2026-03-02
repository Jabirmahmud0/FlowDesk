'use client';

import { PresenceAvatar } from './presence-avatar';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useSocket } from '@/components/providers/socket-provider';
import { useOrg } from '@/hooks/use-org';
import { useSession } from 'next-auth/react';

interface OnlineUser {
    id: string;
    name: string;
    avatarUrl?: string | null;
}

interface PresenceAvatarsProps {
    maxDisplay?: number;
    className?: string;
}

export function PresenceAvatars({ maxDisplay = 4, className }: PresenceAvatarsProps) {
    const socket = useSocket();
    const { org } = useOrg();
    const { data: session } = useSession();
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [totalOnline, setTotalOnline] = useState(0);

    useEffect(() => {
        if (!socket || !org?.id) return;

        // Initial fetch of online users
        fetch(`/api/presence/${org.id}`)
            .then((res) => res.json())
            .then((data) => {
                setTotalOnline(data.count || 0);
                // Note: This would need an API endpoint to get user details
                // For now, we just show the count
            })
            .catch(console.error);

        // Listen for presence updates
        socket.on('PRESENCE_UPDATE', (data: { userId: string; status: string; onlineUsers: string[] }) => {
            setTotalOnline(data.onlineUsers?.length || 0);
        });

        return () => {
            socket.off('PRESENCE_UPDATE');
        };
    }, [socket, org?.id]);

    if (totalOnline <= 1) {
        return null;
    }

    const displayUsers = onlineUsers.slice(0, maxDisplay);
    const remaining = totalOnline - displayUsers.length;

    return (
        <div className={cn('flex items-center -space-x-2', className)}>
            {displayUsers.map((user) => (
                <PresenceAvatar
                    key={user.id}
                    userId={user.id}
                    name={user.name}
                    avatarUrl={user.avatarUrl}
                    size="sm"
                    showTooltip
                />
            ))}
            {remaining > 0 && (
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium ring-2 ring-background">
                    +{remaining}
                </div>
            )}
        </div>
    );
}
