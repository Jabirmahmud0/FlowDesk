import { router, createOrgProcedure } from '../trpc';
import { z } from 'zod';
import { apiKeys } from '@flowdesk/db';
import { eq, and, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// Generate API key with prefix
function generateApiKey(): { key: string; partialKey: string } {
    const prefix = 'fd_sk_';
    const key = prefix + randomUUID().replace(/-/g, '');
    const partialKey = `${prefix}${key.substring(6, 12)}...${key.substring(key.length - 4)}`;
    return { key, partialKey };
}

export const apiKeyRouter = router({
    list: createOrgProcedure()
        .input(z.object({ orgId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            return ctx.db.query.apiKeys.findMany({
                where: and(
                    eq(apiKeys.orgId, input.orgId),
                    eq(apiKeys.createdBy, ctx.user.id)
                ),
                orderBy: (apiKeys, { desc }) => [desc(apiKeys.createdAt)],
            });
        }),

    create: createOrgProcedure()
        .input(z.object({ orgId: z.string().uuid(), name: z.string().min(1) }))
        .mutation(async ({ ctx, input }) => {
            const { key, partialKey } = generateApiKey();

            const [apiKey] = await ctx.db.insert(apiKeys).values({
                orgId: input.orgId,
                name: input.name,
                key, // In production, hash this
                partialKey,
                createdBy: ctx.user.id,
            }).returning();

            return { ...apiKey, key }; // Return full key once
        }),

    revoke: createOrgProcedure()
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db
                .update(apiKeys)
                .set({
                    revoked: true,
                    revokedAt: new Date(),
                })
                .where(and(
                    eq(apiKeys.id, input.id),
                    eq(apiKeys.createdBy, ctx.user.id)
                ));

            return { success: true };
        }),
});
