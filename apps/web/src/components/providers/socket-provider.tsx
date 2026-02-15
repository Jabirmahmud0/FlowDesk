'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { useOrg } from '@/hooks/use-org';

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const { org } = useOrg();
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        if (!session?.user?.id) return;

        // In production, this would be an env var
        const socketUrl = 'http://localhost:3001';

        const socketInstance = io(socketUrl, {
            query: {
                userId: session.user.id,
                orgId: org?.id
            }
        });

        socketInstance.on('connect', () => {
            console.log('Connected to WebSocket');
        });

        socketInstance.on('disconnect', () => {
            console.log('Disconnected from WebSocket');
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [session?.user?.id, org?.id]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
}

export const useSocket = () => {
    return useContext(SocketContext);
};
