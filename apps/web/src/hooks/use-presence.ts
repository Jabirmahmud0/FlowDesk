'use client';

import { useEffect, useCallback } from 'react';
import { useSocket } from '@/components/providers/socket-provider';
import { useOrg } from '@/hooks/use-org';
import { useSession } from 'next-auth/react';

export function usePresence() {
    const socket = useSocket();
    const { org } = useOrg();
    const { data: session } = useSession();

    const setOnline = useCallback(() => {
        if (!socket || !org?.id || !session?.user?.id) return;
        
        fetch(`/api/presence/${org.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: session.user.id,
                action: 'add',
            }),
        }).catch(console.error);
    }, [socket, org?.id, session?.user?.id]);

    const setOffline = useCallback(() => {
        if (!socket || !org?.id || !session?.user?.id) return;
        
        fetch(`/api/presence/${org.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: session.user.id,
                action: 'remove',
            }),
        }).catch(console.error);
    }, [socket, org?.id, session?.user?.id]);

    useEffect(() => {
        if (!socket || !org?.id || !session?.user?.id) return;

        // Set online on connect
        setOnline();

        // Heartbeat every 30 seconds
        const heartbeatInterval = setInterval(() => {
            socket.emit('heartbeat');
        }, 30000);

        // Cleanup on disconnect
        return () => {
            clearInterval(heartbeatInterval);
            setOffline();
        };
    }, [socket, org?.id, session?.user?.id, setOnline, setOffline]);

    return { setOnline, setOffline };
}
