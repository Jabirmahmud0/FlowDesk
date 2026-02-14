import type { db } from '@flowdesk/db';

export interface Session {
    user: {
        id: string;
        name: string;
        email: string;
        image?: string | null;
    };
    expires: string;
}

export interface Membership {
    orgId: string;
    role: string;
}

export interface Context {
    db: typeof db;
    session: Session | null;
    user?: Session['user'];
    orgId?: string;
    memberships?: Membership[];
}

export type { Context as TRPCContext };
