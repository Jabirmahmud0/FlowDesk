/**
 * Plan Limits Enforcement Utility
 *
 * Use this in tRPC procedures to check plan limits before allowing
 * resource creation (members, projects, etc.).
 */

import { PLAN_LIMITS, type Plan } from '@flowdesk/types';
import { TRPCError } from '@trpc/server';
import { eq, sql } from 'drizzle-orm';
import { orgMembers, projects, subscriptions } from '@flowdesk/db';

type DB = any; // Use actual Drizzle client type if available

export async function getOrgPlan(db: DB, orgId: string): Promise<Plan> {
    const sub = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.orgId, orgId),
    });

    if (!sub || sub.status !== 'active') return 'FREE';
    return (sub.plan as Plan) || 'FREE';
}

export async function checkMemberLimit(db: DB, orgId: string): Promise<void> {
    const plan = await getOrgPlan(db, orgId);
    const limits = PLAN_LIMITS[plan];

    const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(orgMembers)
        .where(eq(orgMembers.orgId, orgId));

    const currentCount = result?.count ?? 0;

    if (currentCount >= limits.maxMembers) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Your ${plan} plan allows up to ${limits.maxMembers} members. Please upgrade to add more.`,
        });
    }
}

export async function checkProjectLimit(db: DB, orgId: string): Promise<void> {
    const plan = await getOrgPlan(db, orgId);
    const limits = PLAN_LIMITS[plan];

    if (limits.maxProjects === Infinity) return; // No limit

    const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(projects)
        .where(eq(projects.orgId, orgId));

    const currentCount = result?.count ?? 0;

    if (currentCount >= limits.maxProjects) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Your ${plan} plan allows up to ${limits.maxProjects} projects. Please upgrade to add more.`,
        });
    }
}
