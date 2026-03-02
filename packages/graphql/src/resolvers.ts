import { GraphQLResolveInfo } from 'graphql';
import { db } from '@flowdesk/db';
import {
    users,
    organizations,
    orgMembers,
    invitations,
    workspaces,
    projects,
    tasks,
    taskLabels,
    taskLabelMap,
    comments,
    attachments,
    activityLog,
    documents,
    documentVersions,
    documentComments,
    notifications,
    subscriptions,
} from '@flowdesk/db';
import { eq, and, sql, desc, asc, inArray, isNull, or } from 'drizzle-orm';

// Helper to get current user from context
const getCurrentUser = (ctx: any) => {
    if (!ctx.userId) return null;
    return ctx.userId;
};

// Format date helper
const formatDate = (date: Date | null) => {
    if (!date) return null;
    return date.toISOString();
};

export const resolvers = {
    // Scalars
    DateTime: {
        __serialize: (value: Date) => value.toISOString(),
        __parseValue: (value: string) => new Date(value),
        __parseLiteral: (ast: any) => new Date(ast.value),
    },
    JSON: {
        __serialize: (value: any) => value,
        __parseValue: (value: any) => value,
        __parseLiteral: (ast: any) => ast.value,
    },

    // User resolvers
    User: {
        createdAt: (user: any) => formatDate(user.createdAt),
        updatedAt: (user: any) => formatDate(user.updatedAt),
        emailVerified: (user: any) => formatDate(user.emailVerified),
        organizations: async (user: any) => {
            const members = await db.query.orgMembers.findMany({
                where: eq(orgMembers.userId, user.id),
                with: { organization: true },
            });
            return members.map((m) => m.organization);
        },
        memberships: async (user: any) => {
            return await db.query.orgMembers.findMany({
                where: eq(orgMembers.userId, user.id),
                with: { organization: true },
            });
        },
    },

    // OrgMember resolvers
    OrgMember: {
        joinedAt: (member: any) => formatDate(member.joinedAt),
        user: async (member: any) => {
            const [user] = await db.select().from(users).where(eq(users.id, member.userId));
            return user;
        },
        organization: async (member: any) => {
            const [org] = await db.select().from(organizations).where(eq(organizations.id, member.orgId));
            return org;
        },
    },

    // Organization resolvers
    Organization: {
        createdAt: (org: any) => formatDate(org.createdAt),
        members: async (org: any) => {
            return await db.query.orgMembers.findMany({
                where: eq(orgMembers.orgId, org.id),
                with: { user: true },
            });
        },
        workspaces: async (org: any) => {
            return await db.query.workspaces.findMany({
                where: eq(workspaces.orgId, org.id),
            });
        },
        invitations: async (org: any) => {
            return await db.query.invitations.findMany({
                where: and(eq(invitations.orgId, org.id), isNull(invitations.acceptedAt)),
                with: { inviter: true },
            });
        },
        subscription: async (org: any) => {
            const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.orgId, org.id));
            return sub || null;
        },
    },

    // Subscription resolvers
    Subscription: {
        currentPeriodEnd: (sub: any) => formatDate(sub.currentPeriodEnd),
    },

    // Workspace resolvers
    Workspace: {
        createdAt: (ws: any) => formatDate(ws.createdAt),
        createdBy: async (ws: any) => {
            const [user] = await db.select().from(users).where(eq(users.id, ws.createdBy));
            return user;
        },
        projects: async (ws: any) => {
            return await db.query.projects.findMany({
                where: eq(projects.workspaceId, ws.id),
            });
        },
        documents: async (ws: any) => {
            return await db.query.documents.findMany({
                where: and(eq(documents.workspaceId, ws.id), isNull(documents.parentId)),
            });
        },
    },

    // Project resolvers
    Project: {
        createdAt: (project: any) => formatDate(project.createdAt),
        createdBy: async (project: any) => {
            const [user] = await db.select().from(users).where(eq(users.id, project.createdBy));
            return user;
        },
        tasks: async (project: any) => {
            return await db.query.tasks.findMany({
                where: eq(tasks.projectId, project.id),
                orderBy: asc(tasks.position),
            });
        },
        members: async (project: any) => {
            // Project members would be in a separate table if implemented
            return [];
        },
    },

    // Task resolvers
    Task: {
        createdAt: (task: any) => formatDate(task.createdAt),
        updatedAt: (task: any) => formatDate(task.updatedAt),
        dueDate: (task: any) => formatDate(task.dueDate),
        completedAt: (task: any) => formatDate(task.completedAt),
        assignee: async (task: any) => {
            if (!task.assigneeId) return null;
            const [user] = await db.select().from(users).where(eq(users.id, task.assigneeId));
            return user || null;
        },
        createdBy: async (task: any) => {
            const [user] = await db.select().from(users).where(eq(users.id, task.createdBy));
            return user;
        },
        project: async (task: any) => {
            const [project] = await db.select().from(projects).where(eq(projects.id, task.projectId));
            return project;
        },
        labels: async (task: any) => {
            const mappings = await db.query.taskLabelMap.findMany({
                where: eq(taskLabelMap.taskId, task.id),
                with: { label: true },
            });
            return mappings.map((m) => m.label);
        },
        comments: async (task: any) => {
            return await db.query.comments.findMany({
                where: eq(comments.taskId, task.id),
                with: { user: true },
            });
        },
        attachments: async (task: any) => {
            return await db.query.attachments.findMany({
                where: eq(attachments.taskId, task.id),
                with: { user: true },
            });
        },
    },

    // Comment resolvers
    Comment: {
        createdAt: (comment: any) => formatDate(comment.createdAt),
        updatedAt: (comment: any) => formatDate(comment.updatedAt),
        resolvedAt: (comment: any) => formatDate(comment.resolvedAt),
        user: async (comment: any) => {
            const [user] = await db.select().from(users).where(eq(users.id, comment.userId));
            return user;
        },
        task: async (comment: any) => {
            const [task] = await db.select().from(tasks).where(eq(tasks.id, comment.taskId));
            return task;
        },
        resolvedBy: async (comment: any) => {
            if (!comment.resolvedBy) return null;
            const [user] = await db.select().from(users).where(eq(users.id, comment.resolvedBy));
            return user || null;
        },
    },

    // Attachment resolvers
    Attachment: {
        createdAt: (att: any) => formatDate(att.createdAt),
        user: async (att: any) => {
            const [user] = await db.select().from(users).where(eq(users.id, att.userId));
            return user;
        },
        task: async (att: any) => {
            const [task] = await db.select().from(tasks).where(eq(tasks.id, att.taskId));
            return task;
        },
    },

    // ActivityLog resolvers
    ActivityLog: {
        createdAt: (log: any) => formatDate(log.createdAt),
        user: async (log: any) => {
            const [user] = await db.select().from(users).where(eq(users.id, log.userId));
            return user;
        },
        task: async (log: any) => {
            if (!log.taskId) return null;
            const [task] = await db.select().from(tasks).where(eq(tasks.id, log.taskId));
            return task || null;
        },
        project: async (log: any) => {
            if (!log.projectId) return null;
            const [project] = await db.select().from(projects).where(eq(projects.id, log.projectId));
            return project || null;
        },
        document: async (log: any) => {
            if (!log.documentId) return null;
            const [doc] = await db.select().from(documents).where(eq(documents.id, log.documentId));
            return doc || null;
        },
    },

    // Document resolvers
    Document: {
        createdAt: (doc: any) => formatDate(doc.createdAt),
        updatedAt: (doc: any) => formatDate(doc.updatedAt),
        createdBy: async (doc: any) => {
            const [user] = await db.select().from(users).where(eq(users.id, doc.createdBy));
            return user;
        },
        parent: async (doc: any) => {
            if (!doc.parentId) return null;
            const [parent] = await db.select().from(documents).where(eq(documents.id, doc.parentId));
            return parent || null;
        },
        children: async (doc: any) => {
            return await db.query.documents.findMany({
                where: eq(documents.parentId, doc.id),
            });
        },
        versions: async (doc: any) => {
            return await db.query.documentVersions.findMany({
                where: eq(documentVersions.documentId, doc.id),
                orderBy: desc(documentVersions.createdAt),
                with: { creator: true },
            });
        },
        comments: async (doc: any) => {
            return await db.query.documentComments.findMany({
                where: and(eq(documentComments.documentId, doc.id), isNull(documentComments.parentId)),
                with: { user: true },
            });
        },
    },

    // DocumentVersion resolvers
    DocumentVersion: {
        createdAt: (ver: any) => formatDate(ver.createdAt),
        createdBy: async (ver: any) => {
            const [user] = await db.select().from(users).where(eq(users.id, ver.createdBy));
            return user;
        },
    },

    // DocumentComment resolvers
    DocumentComment: {
        createdAt: (comment: any) => formatDate(comment.createdAt),
        updatedAt: (comment: any) => formatDate(comment.updatedAt),
        resolvedAt: (comment: any) => formatDate(comment.resolvedAt),
        user: async (comment: any) => {
            const [user] = await db.select().from(users).where(eq(users.id, comment.userId));
            return user;
        },
        document: async (comment: any) => {
            const [doc] = await db.select().from(documents).where(eq(documents.id, comment.documentId));
            return doc;
        },
        parent: async (comment: any) => {
            if (!comment.parentId) return null;
            const [parent] = await db.select().from(documentComments).where(eq(documentComments.id, comment.parentId));
            return parent || null;
        },
        replies: async (comment: any) => {
            return await db.query.documentComments.findMany({
                where: eq(documentComments.parentId, comment.id),
                with: { user: true },
            });
        },
    },

    // Notification resolvers
    Notification: {
        createdAt: (notif: any) => formatDate(notif.createdAt),
        readAt: (notif: any) => formatDate(notif.readAt),
        user: async (notif: any) => {
            const [user] = await db.select().from(users).where(eq(users.id, notif.userId));
            return user;
        },
        organization: async (notif: any) => {
            const [org] = await db.select().from(organizations).where(eq(organizations.id, notif.orgId));
            return org;
        },
    },

    // Invitation resolvers
    Invitation: {
        expiresAt: (inv: any) => formatDate(inv.expiresAt),
        acceptedAt: (inv: any) => formatDate(inv.acceptedAt),
        invitedBy: async (inv: any) => {
            if (inv.inviter) return inv.inviter;
            const [user] = await db.select().from(users).where(eq(users.id, inv.invitedBy));
            return user;
        },
    },

    // Query resolvers
    Query: {
        me: async (_: any, __: any, ctx: any) => {
            const userId = getCurrentUser(ctx);
            if (!userId) return null;
            const [user] = await db.select().from(users).where(eq(users.id, userId));
            return user || null;
        },

        user: async (_: any, { id }: { id: string }) => {
            const [user] = await db.select().from(users).where(eq(users.id, id));
            return user || null;
        },

        organization: async (_: any, { id }: { id: string }) => {
            const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
            return org || null;
        },

        organizationBySlug: async (_: any, { slug }: { slug: string }) => {
            const [org] = await db.select().from(organizations).where(eq(organizations.slug, slug));
            return org || null;
        },

        organizations: async (_: any, __: any, ctx: any) => {
            const userId = getCurrentUser(ctx);
            if (!userId) return [];
            const members = await db.query.orgMembers.findMany({
                where: eq(orgMembers.userId, userId),
                with: { organization: true },
            });
            return members.map((m) => m.organization);
        },

        workspace: async (_: any, { id }: { id: string }) => {
            const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, id));
            return ws || null;
        },

        workspacesByOrg: async (_: any, { orgId }: { orgId: string }) => {
            return await db.query.workspaces.findMany({
                where: eq(workspaces.orgId, orgId),
            });
        },

        project: async (_: any, { id }: { id: string }) => {
            const [project] = await db.select().from(projects).where(eq(projects.id, id));
            return project || null;
        },

        projectsByWorkspace: async (_: any, { workspaceId }: { workspaceId: string }) => {
            return await db.query.projects.findMany({
                where: eq(projects.workspaceId, workspaceId),
            });
        },

        projectsByOrg: async (_: any, { orgId }: { orgId: string }) => {
            return await db.query.projects.findMany({
                where: eq(projects.orgId, orgId),
            });
        },

        task: async (_: any, { id }: { id: string }) => {
            const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
            return task || null;
        },

        tasksByProject: async (_: any, { projectId }: { projectId: string }) => {
            return await db.query.tasks.findMany({
                where: eq(tasks.projectId, projectId),
                orderBy: asc(tasks.position),
            });
        },

        tasksByOrg: async (_: any, { orgId }: { orgId: string }) => {
            return await db.query.tasks.findMany({
                where: eq(tasks.orgId, orgId),
            });
        },

        myTasks: async (_: any, { orgId }: { orgId: string }, ctx: any) => {
            const userId = getCurrentUser(ctx);
            if (!userId) return [];
            return await db.query.tasks.findMany({
                where: and(eq(tasks.orgId, orgId), eq(tasks.assigneeId, userId)),
                orderBy: desc(tasks.updatedAt),
                limit: 50,
            });
        },

        labelsByOrg: async (_: any, { orgId }: { orgId: string }) => {
            return await db.query.taskLabels.findMany({
                where: eq(taskLabels.orgId, orgId),
            });
        },

        commentsByTask: async (_: any, { taskId }: { taskId: string }) => {
            return await db.query.comments.findMany({
                where: eq(comments.taskId, taskId),
                orderBy: asc(comments.createdAt),
                with: { user: true },
            });
        },

        document: async (_: any, { id }: { id: string }) => {
            const [doc] = await db.select().from(documents).where(eq(documents.id, id));
            return doc || null;
        },

        documentsByWorkspace: async (_: any, { workspaceId }: { workspaceId: string }) => {
            return await db.query.documents.findMany({
                where: and(eq(documents.workspaceId, workspaceId), isNull(documents.parentId)),
            });
        },

        documentsByOrg: async (_: any, { orgId }: { orgId: string }) => {
            return await db.query.documents.findMany({
                where: eq(documents.orgId, orgId),
            });
        },

        documentVersions: async (_: any, { documentId }: { documentId: string }) => {
            return await db.query.documentVersions.findMany({
                where: eq(documentVersions.documentId, documentId),
                orderBy: desc(documentVersions.createdAt),
            });
        },

        documentComments: async (_: any, { documentId }: { documentId: string }) => {
            return await db.query.documentComments.findMany({
                where: and(eq(documentComments.documentId, documentId), isNull(documentComments.parentId)),
                with: { user: true, replies: { with: { user: true } } },
            });
        },

        activityByOrg: async (_: any, { orgId, limit = 50 }: { orgId: string; limit?: number }) => {
            return await db.query.activityLog.findMany({
                where: eq(activityLog.orgId, orgId),
                orderBy: desc(activityLog.createdAt),
                limit,
                with: { user: true },
            });
        },

        activityByTask: async (_: any, { taskId }: { taskId: string }) => {
            return await db.query.activityLog.findMany({
                where: eq(activityLog.taskId, taskId),
                orderBy: desc(activityLog.createdAt),
            });
        },

        activityByProject: async (_: any, { projectId }: { projectId: string }) => {
            return await db.query.activityLog.findMany({
                where: eq(activityLog.projectId, projectId),
                orderBy: desc(activityLog.createdAt),
            });
        },

        notifications: async (_: any, __: any, ctx: any) => {
            const userId = getCurrentUser(ctx);
            if (!userId) return [];
            return await db.query.notifications.findMany({
                where: eq(notifications.userId, userId),
                orderBy: desc(notifications.createdAt),
                limit: 50,
            });
        },

        unreadNotificationCount: async (_: any, __: any, ctx: any) => {
            const userId = getCurrentUser(ctx);
            if (!userId) return 0;
            const [result] = await db
                .select({ count: sql<number>`count(*)::int` })
                .from(notifications)
                .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
            return result?.count ?? 0;
        },

        dashboardStats: async (_: any, { orgId, days = 30 }: { orgId: string; days?: number }) => {
            const dateLimit = new Date();
            dateLimit.setDate(dateLimit.getDate() - days);

            const [totalTasksResult] = await db
                .select({ count: sql<number>`count(*)::int` })
                .from(tasks)
                .where(eq(tasks.orgId, orgId));

            const [completedTasksResult] = await db
                .select({ count: sql<number>`count(*)::int` })
                .from(tasks)
                .where(and(eq(tasks.orgId, orgId), eq(tasks.status, 'DONE')));

            const [inProgressResult] = await db
                .select({ count: sql<number>`count(*)::int` })
                .from(tasks)
                .where(and(eq(tasks.orgId, orgId), eq(tasks.status, 'IN_PROGRESS')));

            const [overdueResult] = await db
                .select({ count: sql<number>`count(*)::int` })
                .from(tasks)
                .where(
                    and(
                        eq(tasks.orgId, orgId),
                        eq(tasks.status, 'IN_PROGRESS'),
                        sql`due_date < NOW()`
                    )
                );

            const [totalProjectsResult] = await db
                .select({ count: sql<number>`count(*)::int` })
                .from(projects)
                .where(eq(projects.orgId, orgId));

            const [activeProjectsResult] = await db
                .select({ count: sql<number>`count(*)::int` })
                .from(projects)
                .where(and(eq(projects.orgId, orgId), eq(projects.status, 'ACTIVE')));

            return {
                totalTasks: totalTasksResult?.count ?? 0,
                completedTasks: completedTasksResult?.count ?? 0,
                inProgressTasks: inProgressResult?.count ?? 0,
                overdueTasks: overdueResult?.count ?? 0,
                totalProjects: totalProjectsResult?.count ?? 0,
                activeProjects: activeProjectsResult?.count ?? 0,
            };
        },

        taskCompletion: async (_: any, { orgId }: { orgId: string }) => {
            const [totalResult] = await db
                .select({ count: sql<number>`count(*)::int` })
                .from(tasks)
                .where(eq(tasks.orgId, orgId));

            const [completedResult] = await db
                .select({ count: sql<number>`count(*)::int` })
                .from(tasks)
                .where(and(eq(tasks.orgId, orgId), eq(tasks.status, 'DONE')));

            const total = totalResult?.count ?? 0;
            const completed = completedResult?.count ?? 0;
            const completionRate = total > 0 ? (completed / total) * 100 : 0;

            return { total, completed, completionRate };
        },

        velocity: async (_: any, { orgId, days = 30 }: { orgId: string; days?: number }) => {
            // Simplified velocity - in production would group by week
            const [completedResult] = await db
                .select({ count: sql<number>`count(*)::int` })
                .from(tasks)
                .where(
                    and(
                        eq(tasks.orgId, orgId),
                        eq(tasks.status, 'DONE'),
                        sql`completed_at >= NOW() - INTERVAL '${days} days'`
                    )
                );

            const weeks = Math.ceil(days / 7);
            const perWeek = Math.round((completedResult?.count ?? 0) / weeks);

            return Array.from({ length: weeks }, (_, i) => ({
                week: `Week ${i + 1}`,
                completed: perWeek,
            }));
        },

        subscription: async (_: any, { orgId }: { orgId: string }) => {
            const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.orgId, orgId));
            return sub || null;
        },
    },

    // Mutation resolvers
    Mutation: {
        createOrganization: async (_: any, { input }: { input: any }, ctx: any) => {
            const userId = getCurrentUser(ctx);
            if (!userId) throw new Error('Unauthorized');

            const [org] = await db.insert(organizations).values({
                name: input.name,
                slug: input.slug,
                plan: 'FREE',
                createdBy: userId,
            }).returning();

            // Create owner membership
            await db.insert(orgMembers).values({
                orgId: org.id,
                userId,
                role: 'OWNER',
            });

            return org;
        },

        updateOrganization: async (_: any, { input }: { input: any }) => {
            const updateData: any = {};
            if (input.name) updateData.name = input.name;
            if (input.slug) updateData.slug = input.slug;
            if (input.logoUrl !== undefined) updateData.logoUrl = input.logoUrl;

            const [updated] = await db
                .update(organizations)
                .set(updateData)
                .where(eq(organizations.id, input.orgId))
                .returning();

            return updated;
        },

        deleteOrganization: async (_: any, { orgId }: { orgId: string }) => {
            await db.delete(organizations).where(eq(organizations.id, orgId));
            return true;
        },

        inviteMember: async (_: any, { input }: { input: any }, ctx: any) => {
            const userId = getCurrentUser(ctx);
            if (!userId) throw new Error('Unauthorized');

            const token = Math.random().toString(36).substring(2);
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24);

            const [invitation] = await db.insert(invitations).values({
                orgId: input.orgId,
                email: input.email,
                role: input.role,
                invitedBy: userId,
                token,
                expiresAt,
            }).returning();

            return invitation;
        },

        updateMemberRole: async (_: any, { orgId, userId, role }: { orgId: string; userId: string; role: any }) => {
            await db
                .update(orgMembers)
                .set({ role })
                .where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, userId)));

            const [updated] = await db
                .select()
                .from(orgMembers)
                .where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, userId)));

            return updated;
        },

        removeMember: async (_: any, { orgId, userId }: { orgId: string; userId: string }) => {
            await db
                .delete(orgMembers)
                .where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, userId)));
            return true;
        },

        acceptInvite: async (_: any, { token }: { token: string }, ctx: any) => {
            const userId = getCurrentUser(ctx);
            if (!userId) throw new Error('Unauthorized');

            const [invitation] = await db.select().from(invitations).where(eq(invitations.token, token));
            if (!invitation) throw new Error('Invalid invitation');

            const now = new Date();
            if (invitation.expiresAt < now) throw new Error('Invitation expired');

            // Add member
            await db.insert(orgMembers).values({
                orgId: invitation.orgId,
                userId,
                role: invitation.role,
            });

            // Mark invitation as accepted
            await db
                .update(invitations)
                .set({ acceptedAt: now })
                .where(eq(invitations.token, token));

            const [member] = await db
                .select()
                .from(orgMembers)
                .where(and(eq(orgMembers.orgId, invitation.orgId), eq(orgMembers.userId, userId)));

            return member;
        },

        createWorkspace: async (_: any, { input }: { input: any }, ctx: any) => {
            const userId = getCurrentUser(ctx);
            if (!userId) throw new Error('Unauthorized');

            const [workspace] = await db.insert(workspaces).values({
                orgId: input.orgId,
                name: input.name,
                slug: input.slug,
                color: input.color,
                createdBy: userId,
            }).returning();

            return workspace;
        },

        updateWorkspace: async (_: any, { input }: { input: any }) => {
            const updateData: any = {};
            if (input.name) updateData.name = input.name;
            if (input.color) updateData.color = input.color;

            const [updated] = await db
                .update(workspaces)
                .set(updateData)
                .where(eq(workspaces.id, input.id))
                .returning();

            return updated;
        },

        deleteWorkspace: async (_: any, { id }: { id: string }) => {
            await db.delete(workspaces).where(eq(workspaces.id, id));
            return true;
        },

        createProject: async (_: any, { input }: { input: any }, ctx: any) => {
            const userId = getCurrentUser(ctx);
            if (!userId) throw new Error('Unauthorized');

            const [project] = await db.insert(projects).values({
                orgId: input.orgId,
                workspaceId: input.workspaceId,
                name: input.name,
                slug: input.slug,
                description: input.description,
                icon: input.icon,
                status: 'ACTIVE',
                createdBy: userId,
            }).returning();

            return project;
        },

        updateProject: async (_: any, { input }: { input: any }) => {
            const updateData: any = {};
            if (input.name) updateData.name = input.name;
            if (input.description !== undefined) updateData.description = input.description;
            if (input.status) updateData.status = input.status;
            if (input.icon) updateData.icon = input.icon;

            const [updated] = await db
                .update(projects)
                .set(updateData)
                .where(eq(projects.id, input.id))
                .returning();

            return updated;
        },

        deleteProject: async (_: any, { id }: { id: string }) => {
            await db.delete(projects).where(eq(projects.id, id));
            return true;
        },

        archiveProject: async (_: any, { id }: { id: string }) => {
            const [updated] = await db
                .update(projects)
                .set({ status: 'ARCHIVED' })
                .where(eq(projects.id, id))
                .returning();

            return updated;
        },

        createTask: async (_: any, { input }: { input: any }, ctx: any) => {
            const userId = getCurrentUser(ctx);
            if (!userId) throw new Error('Unauthorized');

            // Get max position for ordering
            const [maxPos] = await db
                .select({ max: sql<number>`MAX(position)` })
                .from(tasks)
                .where(eq(tasks.projectId, input.projectId));

            const position = (maxPos?.max ?? -1) + 1;

            const [task] = await db.insert(tasks).values({
                orgId: input.orgId,
                projectId: input.projectId,
                title: input.title,
                description: input.description,
                status: input.status || 'TODO',
                priority: input.priority || 'NONE',
                position,
                assigneeId: input.assigneeId,
                dueDate: input.dueDate ? new Date(input.dueDate) : null,
                createdBy: userId,
            }).returning();

            return task;
        },

        updateTask: async (_: any, { input }: { input: any }) => {
            const updateData: any = {};
            if (input.title) updateData.title = input.title;
            if (input.description !== undefined) updateData.description = input.description;
            if (input.status) {
                updateData.status = input.status;
                if (input.status === 'DONE') updateData.completedAt = new Date();
            }
            if (input.priority) updateData.priority = input.priority;
            if (input.assigneeId !== undefined) updateData.assigneeId = input.assigneeId;
            if (input.dueDate !== undefined) updateData.dueDate = input.dueDate ? new Date(input.dueDate) : null;
            updateData.updatedAt = new Date();

            const [updated] = await db
                .update(tasks)
                .set(updateData)
                .where(eq(tasks.id, input.id))
                .returning();

            return updated;
        },

        deleteTask: async (_: any, { id }: { id: string }) => {
            await db.delete(tasks).where(eq(tasks.id, id));
            return true;
        },

        moveTask: async (_: any, { input }: { input: any }) => {
            const [updated] = await db
                .update(tasks)
                .set({
                    status: input.status,
                    position: input.position,
                    updatedAt: new Date(),
                })
                .where(eq(tasks.id, input.id))
                .returning();

            return updated;
        },

        bulkUpdateTasks: async (_: any, { input }: { input: any }) => {
            const updateData: any = { updatedAt: new Date() };
            if (input.status) updateData.status = input.status;
            if (input.assigneeId !== undefined) updateData.assigneeId = input.assigneeId;
            if (input.priority) updateData.priority = input.priority;

            await db
                .update(tasks)
                .set(updateData)
                .where(inArray(tasks.id, input.ids));

            return await db.query.tasks.findMany({
                where: inArray(tasks.id, input.ids),
            });
        },

        createComment: async (_: any, { input }: { input: any }, ctx: any) => {
            const userId = getCurrentUser(ctx);
            if (!userId) throw new Error('Unauthorized');

            const [comment] = await db.insert(comments).values({
                taskId: input.taskId,
                userId,
                content: input.content,
            }).returning();

            return comment;
        },

        updateComment: async (_: any, { input }: { input: any }) => {
            const updateData: any = {};
            if (input.content) updateData.content = input.content;
            updateData.updatedAt = new Date();

            const [updated] = await db
                .update(comments)
                .set(updateData)
                .where(eq(comments.id, input.id))
                .returning();

            return updated;
        },

        deleteComment: async (_: any, { id }: { id: string }) => {
            await db.delete(comments).where(eq(comments.id, id));
            return true;
        },

        createDocument: async (_: any, { input }: { input: any }, ctx: any) => {
            const userId = getCurrentUser(ctx);
            if (!userId) throw new Error('Unauthorized');

            const [document] = await db.insert(documents).values({
                orgId: input.orgId,
                workspaceId: input.workspaceId,
                title: input.title,
                content: input.content,
                parentId: input.parentId,
                icon: input.icon,
                createdBy: userId,
            }).returning();

            return document;
        },

        updateDocument: async (_: any, { input }: { input: any }) => {
            const updateData: any = { updatedAt: new Date() };
            if (input.title) updateData.title = input.title;
            if (input.content !== undefined) updateData.content = input.content;
            if (input.icon) updateData.icon = input.icon;

            const [updated] = await db
                .update(documents)
                .set(updateData)
                .where(eq(documents.id, input.id))
                .returning();

            return updated;
        },

        deleteDocument: async (_: any, { id }: { id: string }) => {
            await db.delete(documents).where(eq(documents.id, id));
            return true;
        },

        createDocumentVersion: async (
            _: any,
            { documentId, title, content, changeNote }: { documentId: string; title: string; content?: any; changeNote?: string },
            ctx: any
        ) => {
            const userId = getCurrentUser(ctx);
            if (!userId) throw new Error('Unauthorized');

            const [doc] = await db.select().from(documents).where(eq(documents.id, documentId));
            if (!doc) throw new Error('Document not found');

            // Get next version number
            const [lastVersion] = await db
                .select()
                .from(documentVersions)
                .where(eq(documentVersions.documentId, documentId))
                .orderBy(desc(documentVersions.versionNumber))
                .limit(1);
            const nextVersionNumber = (lastVersion?.versionNumber ?? 0) + 1;

            const [version] = await db.insert(documentVersions).values({
                documentId,
                orgId: doc.orgId,
                versionNumber: nextVersionNumber,
                title,
                content,
                changeNote,
                createdBy: userId,
            }).returning();

            return version;
        },

        restoreDocumentVersion: async (_: any, { versionId }: { versionId: string }) => {
            const [version] = await db.select().from(documentVersions).where(eq(documentVersions.id, versionId));
            if (!version) throw new Error('Version not found');

            const [updated] = await db
                .update(documents)
                .set({
                    title: version.title,
                    content: version.content,
                    updatedAt: new Date(),
                })
                .where(eq(documents.id, version.documentId))
                .returning();

            return updated;
        },

        createDocumentComment: async (_: any, { input }: { input: any }, ctx: any) => {
            const userId = getCurrentUser(ctx);
            if (!userId) throw new Error('Unauthorized');

            const [comment] = await db.insert(documentComments).values({
                orgId: input.orgId,
                documentId: input.documentId,
                userId,
                content: input.content,
                parentId: input.parentId,
            }).returning();

            return comment;
        },

        updateDocumentComment: async (_: any, { id, content, resolved }: { id: string; content?: string; resolved?: boolean }) => {
            const updateData: any = { updatedAt: new Date() };
            if (content) updateData.content = content;
            if (resolved) updateData.resolvedAt = new Date();

            const [updated] = await db
                .update(documentComments)
                .set(updateData)
                .where(eq(documentComments.id, id))
                .returning();

            return updated;
        },

        deleteDocumentComment: async (_: any, { id }: { id: string }) => {
            await db.delete(documentComments).where(eq(documentComments.id, id));
            return true;
        },

        markNotificationRead: async (_: any, { id }: { id: string }) => {
            const [updated] = await db
                .update(notifications)
                .set({ readAt: new Date() })
                .where(eq(notifications.id, id))
                .returning();

            return updated;
        },

        markAllNotificationsRead: async (_: any, __: any, ctx: any) => {
            const userId = getCurrentUser(ctx);
            if (!userId) return false;

            await db
                .update(notifications)
                .set({ readAt: new Date() })
                .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));

            return true;
        },

        deleteAttachment: async (_: any, { id }: { id: string }) => {
            await db.delete(attachments).where(eq(attachments.id, id));
            return true;
        },
    },
};
