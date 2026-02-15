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
    return protectedProcedure.use(async (opts) => {
        const { ctx, next } = opts;

        // Handle tRPC v11 rawInput retrieval
        let rawInput = (opts as any).rawInput;
        if (!rawInput && typeof (opts as any).getRawInput === 'function') {
            rawInput = await (opts as any).getRawInput();
        }

        const input = (opts as any).input;

        // @ts-ignore
        const _input = (input || rawInput || {}) as any;

        // Debug log (keep enabled until verified)
        console.log('[Middleware] Input resolution:', {
            hasInput: !!input,
            hasRawInput: !!rawInput,
            extractedKeys: Object.keys(_input || {}),
            val: _input
        });

        // Handle possible nested SuperJSON structure or direct input
        const orgId = _input?.orgId || _input?.json?.orgId || ctx.orgId;

        if (!orgId) {
            console.error('[Middleware] Missing orgId. Full Input was:', JSON.stringify(_input));
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
