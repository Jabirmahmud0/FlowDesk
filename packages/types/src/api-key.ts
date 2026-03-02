import { z } from 'zod';

export const createApiKeySchema = z.object({
    orgId: z.string().uuid(),
    name: z.string().min(1).max(100),
});

export const revokeApiKeySchema = z.object({
    id: z.string().uuid(),
});
