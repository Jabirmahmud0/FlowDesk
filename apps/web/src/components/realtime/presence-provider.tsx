'use client';

import { usePresence } from '@/hooks/use-presence';
import { PresenceAvatars } from '@/components/realtime/presence-avatars';

export function PresenceProvider({ children }: { children: React.ReactNode }) {
    usePresence();

    return (
        <>
            {children}
        </>
    );
}
