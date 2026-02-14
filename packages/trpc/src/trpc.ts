import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { Context } from './context';

const t = initTRPC.context<Context>().create({
    transformer: superjson,
    errorFormatter({ shape, error }) {
        return {
            ...shape,
            data: {
                ...shape.data,
                zodError: error.cause instanceof Error ? error.cause.message : null,
            },
        };
    },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

/**
 * Middleware: Require authenticated user
 */
const isAuthed = t.middleware(({ ctx, next }) => {
    if (!ctx.session?.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'You must be logged in' });
    }
    return next({
        ctx: {
            ...ctx,
            session: ctx.session,
            user: ctx.session.user,
        },
    });
});

export const protectedProcedure = t.procedure.use(isAuthed);

/**
 * Middleware: Require org membership with minimum role
 */
export const createOrgProcedure = (minRole?: 'OWNER' | 'ADMIN' | 'MEMBER') => {
    return protectedProcedure.use(async ({ ctx, next, rawInput }) => {
        const input = rawInput as { orgId?: string };
        const orgId = input?.orgId || ctx.orgId;

        if (!orgId) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Organization ID is required',
            });
        }

        // Verify membership
        const membership = ctx.memberships?.find((m) => m.orgId === orgId);

        if (!membership) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'You are not a member of this organization',
            });
        }

        // Check minimum role if specified
        if (minRole) {
            const roleHierarchy = { OWNER: 4, ADMIN: 3, MEMBER: 2, VIEWER: 1 };
            const userLevel = roleHierarchy[membership.role as keyof typeof roleHierarchy] || 0;
            const requiredLevel = roleHierarchy[minRole];

            if (userLevel < requiredLevel) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: `This action requires at least ${minRole} role`,
                });
            }
        }

        return next({
            ctx: {
                ...ctx,
                orgId,
                membership,
            },
        });
    });
};
