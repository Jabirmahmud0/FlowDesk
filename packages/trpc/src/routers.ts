import { router, publicProcedure, protectedProcedure, createOrgProcedure } from './trpc';
import { z } from 'zod';
import {
    organizations,
    orgMembers,
    workspaces,
    projects,
    tasks,
    invitations,
    comments,
    taskLabels,
    taskLabelMap,
    attachments,
    activityLog,
    documents,
    notifications,
    subscriptions,
} from '@flowdesk/db';
import {
    createOrgSchema,
    updateOrgSchema,
    createWorkspaceSchema,
    updateWorkspaceSchema,
    createProjectSchema,
    updateProjectSchema,
    createTaskSchema,
    updateTaskSchema,
    moveTaskSchema,
    bulkUpdateTasksSchema,
    createCommentSchema,
    updateCommentSchema,
    inviteMemberSchema,
    createDocumentSchema,
    updateDocumentSchema,
} from '@flowdesk/types';
import { eq, and, desc, asc, sql, ilike, relations } from 'drizzle-orm';
import { broadcast } from './lib/socket';
import { randomUUID } from 'crypto';
import { billingRouter } from './routers/billing';

// ─── Organization Router ────────────────────────────────────────────
export const orgRouter = router({
    hello: publicProcedure.query(() => {
        return { message: 'Hello from tRPC' };
    }),
    create: protectedProcedure.input(createOrgSchema).mutation(async ({ ctx, input }) => {
        // console.log('[TRPC] org.create called with:', input);
        // console.log('[TRPC] User:', ctx.user.id);
        try {
            const [org] = await ctx.db
                .insert(organizations)
                .values({
                    name: input.name,
                    slug: input.slug,
                    createdBy: ctx.user.id,
                })
                .returning();
            console.log('[TRPC] Org created:', org.id);

            // Add creator as OWNER
            await ctx.db.insert(orgMembers).values({
                orgId: org.id,
                userId: ctx.user.id,
                role: 'OWNER',
            });

            // Create default workspace
            await ctx.db.insert(workspaces).values({
                orgId: org.id,
                name: 'General',
                slug: 'general',
                createdBy: ctx.user.id,
            });

            return org;
        } catch (error: any) {
            console.error('[TRPC] org.create failed:', error);
            throw error;
        }
    }),

    getBySlug: protectedProcedure
        .input(z.object({ slug: z.string() }))
        .query(async ({ ctx, input }) => {
            const org = await ctx.db.query.organizations.findFirst({
                where: eq(organizations.slug, input.slug),
                with: {
                    members: { with: { user: true } },
                    subscription: true,
                },
            });

            if (!org) throw new Error('Organization not found');
            return org;
        }),

    update: createOrgProcedure('ADMIN')
        .input(updateOrgSchema)
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;
            const [updated] = await ctx.db
                .update(organizations)
                .set({ ...data, updatedAt: new Date() })
                .where(eq(organizations.id, id))
                .returning();
            return updated;
        }),

    delete: createOrgProcedure('OWNER')
        .input(z.object({ orgId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db.delete(organizations).where(eq(organizations.id, input.orgId));
            return { success: true };
        }),

    list: protectedProcedure.query(async ({ ctx }) => {
        const memberships = await ctx.db.query.orgMembers.findMany({
            where: eq(orgMembers.userId, ctx.user.id),
            with: {
                organization: {
                    with: { subscription: true },
                },
            },
        });
        return memberships.map((m) => ({
            ...m.organization,
            role: m.role,
        }));
    }),
});

// ─── Members Router ─────────────────────────────────────────────────
export const membersRouter = router({
    list: createOrgProcedure()
        .input(z.object({ orgId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            return ctx.db.query.orgMembers.findMany({
                where: eq(orgMembers.orgId, input.orgId),
                with: { user: true },
                orderBy: [asc(orgMembers.joinedAt)],
            });
        }),

    invite: createOrgProcedure('ADMIN')
        .input(inviteMemberSchema)
        .mutation(async ({ ctx, input }) => {
            const token = randomUUID();
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24hr

            const [invitation] = await ctx.db
                .insert(invitations)
                .values({
                    orgId: input.orgId,
                    email: input.email,
                    role: input.role,
                    token,
                    invitedBy: ctx.user.id,
                    expiresAt,
                })
                .returning();

            // TODO: Send email via Resend
            return invitation;
        }),

    updateRole: createOrgProcedure('ADMIN')
        .input(
            z.object({
                orgId: z.string().uuid(),
                userId: z.string().uuid(),
                role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const [updated] = await ctx.db
                .update(orgMembers)
                .set({ role: input.role })
                .where(and(eq(orgMembers.orgId, input.orgId), eq(orgMembers.userId, input.userId)))
                .returning();
            return updated;
        }),

    remove: createOrgProcedure('ADMIN')
        .input(z.object({ orgId: z.string().uuid(), userId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db
                .delete(orgMembers)
                .where(and(eq(orgMembers.orgId, input.orgId), eq(orgMembers.userId, input.userId)));
            return { success: true };
        }),

    acceptInvite: protectedProcedure
        .input(z.object({ token: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const invitation = await ctx.db.query.invitations.findFirst({
                where: eq(invitations.token, input.token),
            });

            if (!invitation) throw new Error('Invalid invitation');
            if (invitation.acceptedAt) throw new Error('Invitation already accepted');
            if (new Date() > invitation.expiresAt) throw new Error('Invitation expired');

            // Mark accepted
            await ctx.db
                .update(invitations)
                .set({ acceptedAt: new Date() })
                .where(eq(invitations.id, invitation.id));

            // Add as member
            await ctx.db.insert(orgMembers).values({
                orgId: invitation.orgId,
                userId: ctx.user.id,
                role: invitation.role,
                invitedBy: invitation.invitedBy,
            });

            return { success: true, orgId: invitation.orgId };
        }),
});

// ─── Workspace Router ────────────────────────────────────────────────
export const workspaceRouter = router({
    create: createOrgProcedure('ADMIN')
        .input(createWorkspaceSchema)
        .mutation(async ({ ctx, input }) => {
            const [ws] = await ctx.db
                .insert(workspaces)
                .values({ ...input, createdBy: ctx.user.id })
                .returning();
            return ws;
        }),

    list: createOrgProcedure()
        .input(z.object({ orgId: z.string().uuid().optional() }))
        .query(async ({ ctx, input }) => {
            const orgId = input.orgId || ctx.orgId;
            if (!orgId) throw new Error('Organization ID required');

            return ctx.db.query.workspaces.findMany({
                where: eq(workspaces.orgId, orgId),
                orderBy: [asc(workspaces.name)],
            });
        }),

    getBySlug: createOrgProcedure()
        .input(z.object({ orgId: z.string().uuid(), slug: z.string() }))
        .query(async ({ ctx, input }) => {
            return ctx.db.query.workspaces.findFirst({
                where: and(eq(workspaces.orgId, input.orgId), eq(workspaces.slug, input.slug)),
                with: { projects: true },
            });
        }),

    update: createOrgProcedure('ADMIN')
        .input(updateWorkspaceSchema)
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;
            const [updated] = await ctx.db
                .update(workspaces)
                .set({ ...data, updatedAt: new Date() })
                .where(eq(workspaces.id, id))
                .returning();
            return updated;
        }),

    delete: createOrgProcedure('ADMIN')
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db.delete(workspaces).where(eq(workspaces.id, input.id));
            return { success: true };
        }),
});

// ─── Project Router ─────────────────────────────────────────────────
export const projectRouter = router({
    create: createOrgProcedure('MEMBER')
        .input(createProjectSchema)
        .mutation(async ({ ctx, input }) => {
            const [project] = await ctx.db
                .insert(projects)
                .values({
                    ...input,
                    orgId: ctx.orgId!,
                    createdBy: ctx.user.id,
                })
                .returning();
            return project;
        }),

    list: createOrgProcedure()
        .input(z.object({ orgId: z.string().uuid(), workspaceId: z.string().uuid().optional() }))
        .query(async ({ ctx, input }) => {
            const conditions = [eq(projects.orgId, input.orgId)];
            if (input.workspaceId) {
                conditions.push(eq(projects.workspaceId, input.workspaceId));
            }
            return ctx.db.query.projects.findMany({
                where: and(...conditions),
                with: { members: { with: { user: true } } },
                orderBy: [desc(projects.createdAt)],
            });
        }),

    getWithTasks: createOrgProcedure()
        .input(z.object({ orgId: z.string().uuid(), slug: z.string() }))
        .query(async ({ ctx, input }) => {
            return ctx.db.query.projects.findFirst({
                where: and(eq(projects.orgId, input.orgId), eq(projects.slug, input.slug)),
                with: {
                    tasks: {
                        with: {
                            assignee: true,
                            labels: { with: { label: true } },
                        },
                        orderBy: [asc(tasks.position)],
                    },
                    members: { with: { user: true } },
                },
            });
        }),

    update: createOrgProcedure('MEMBER')
        .input(updateProjectSchema)
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;
            const [updated] = await ctx.db
                .update(projects)
                .set({ ...data, updatedAt: new Date() })
                .where(eq(projects.id, id))
                .returning();
            return updated;
        }),

    delete: createOrgProcedure('ADMIN')
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db.delete(projects).where(eq(projects.id, input.id));
            return { success: true };
        }),
});

// ─── Task Router ────────────────────────────────────────────────────
export const taskRouter = router({
    create: createOrgProcedure('MEMBER')
        .input(createTaskSchema)
        .mutation(async ({ ctx, input }) => {
            // Get next position
            const lastTask = await ctx.db.query.tasks.findFirst({
                where: and(
                    eq(tasks.projectId, input.projectId),
                    eq(tasks.status, input.status || 'TODO')
                ),
                orderBy: [desc(tasks.position)],
            });
            const position = (lastTask?.position ?? -1) + 1;

            const [task] = await ctx.db
                .insert(tasks)
                .values({
                    ...input,
                    orgId: ctx.orgId!,
                    createdBy: ctx.user.id,
                    position,
                    dueDate: input.dueDate ? new Date(input.dueDate) : null,
                })
                .returning();

            if (input.assigneeId && input.assigneeId !== ctx.user.id) {
                const notification = {
                    userId: input.assigneeId,
                    orgId: ctx.orgId!,
                    type: 'TASK_ASSIGNED',
                    title: 'New Task Assigned',
                    body: `You have been assigned to task "${task.title}"`,
                    payload: { taskId: task.id, projectId: task.projectId },
                };

                await ctx.db.insert(notifications).values(notification as any);

                // Broadcast
                await broadcast('NOTIFICATION', notification, `user:${input.assigneeId}`);
            }

            return task;
        }),

    listByProject: createOrgProcedure()
        .input(z.object({ orgId: z.string().uuid(), projectId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            return ctx.db.query.tasks.findMany({
                where: eq(tasks.projectId, input.projectId),
                with: {
                    assignee: true,
                    labels: { with: { label: true } },
                },
                orderBy: [asc(tasks.position)],
            });
        }),

    myTasks: createOrgProcedure()
        .input(z.object({ orgId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            return ctx.db.query.tasks.findMany({
                where: and(
                    eq(tasks.orgId, input.orgId),
                    eq(tasks.assigneeId, ctx.user.id),
                    // exclude DONE tasks from "My Tasks" view usually? Or maybe just limit?
                    // Let's include all for now, frontend can filter or we can add filter input later.
                ),
                with: {
                    project: true,
                    assignee: true,
                    labels: { with: { label: true } },
                },
                orderBy: [desc(tasks.updatedAt)],
                limit: 50,
            });
        }),

    update: createOrgProcedure('MEMBER')
        .input(updateTaskSchema)
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;
            const updateData: Record<string, unknown> = {
                ...data,
                updatedAt: new Date(),
            };
            if (data.dueDate) updateData.dueDate = new Date(data.dueDate);
            if (data.status === 'DONE') updateData.completedAt = new Date();

            const [currentTask] = await ctx.db
                .select()
                .from(tasks)
                .where(eq(tasks.id, id));

            const [updated] = await ctx.db
                .update(tasks)
                .set(updateData)
                .where(eq(tasks.id, id))
                .returning();

            // Notify on reassignment
            if (
                input.assigneeId &&
                input.assigneeId !== ctx.user.id &&
                input.assigneeId !== currentTask?.assigneeId
            ) {
                const notification = {
                    userId: input.assigneeId,
                    orgId: ctx.orgId!,
                    type: 'TASK_ASSIGNED',
                    title: 'Task Assigned',
                    body: `You have been assigned to task "${updated.title}"`,
                    payload: { taskId: updated.id, projectId: updated.projectId },
                };

                await ctx.db.insert(notifications).values(notification as any);

                // Broadcast
                await broadcast('NOTIFICATION', notification, `user:${input.assigneeId}`);
            }

            // Broadcast task update to org room (for board updates)
            await broadcast('TASK_UPDATED', updated, `org:${ctx.orgId}`);

            return updated;
        }),

    move: createOrgProcedure('MEMBER')
        .input(moveTaskSchema)
        .mutation(async ({ ctx, input }) => {
            const [moved] = await ctx.db
                .update(tasks)
                .set({
                    status: input.status,
                    position: input.position,
                    updatedAt: new Date(),
                    completedAt: input.status === 'DONE' ? new Date() : null,
                })
                .where(eq(tasks.id, input.id))
                .returning();
            return moved;
        }),

    bulkUpdate: createOrgProcedure('MEMBER')
        .input(bulkUpdateTasksSchema)
        .mutation(async ({ ctx, input }) => {
            const { ids, ...data } = input;
            const updateData: Record<string, unknown> = { ...data, updatedAt: new Date() };
            if (data.status === 'DONE') updateData.completedAt = new Date();

            const results = [];
            for (const id of ids) {
                const [updated] = await ctx.db
                    .update(tasks)
                    .set(updateData)
                    .where(eq(tasks.id, id))
                    .returning();
                results.push(updated);
            }
            return results;
        }),

    delete: createOrgProcedure('MEMBER')
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db.delete(tasks).where(eq(tasks.id, input.id));
            return { success: true };
        }),
});

// ─── Comment Router ─────────────────────────────────────────────────
export const commentRouter = router({
    listByTask: createOrgProcedure()
        .input(z.object({ orgId: z.string().uuid(), taskId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            return ctx.db.query.comments.findMany({
                where: eq(comments.taskId, input.taskId),
                with: { user: true },
                orderBy: [asc(comments.createdAt)],
            });
        }),

    create: createOrgProcedure('MEMBER')
        .input(createCommentSchema)
        .mutation(async ({ ctx, input }) => {
            const [comment] = await ctx.db
                .insert(comments)
                .values({
                    taskId: input.taskId,
                    userId: ctx.user.id,
                    content: input.content,
                })
                .returning();

            // Notify assignee
            const task = await ctx.db.query.tasks.findFirst({
                where: eq(tasks.id, input.taskId),
            });

            if (task && task.assigneeId && task.assigneeId !== ctx.user.id) {
                const notification = {
                    userId: task.assigneeId,
                    orgId: ctx.orgId!,
                    type: 'COMMENT_ADDED',
                    title: 'New Comment',
                    body: `New comment on task "${task.title}"`,
                    payload: { taskId: task.id, projectId: task.projectId, commentId: comment.id },
                };

                await ctx.db.insert(notifications).values(notification as any);

                // Broadcast notification
                await broadcast('NOTIFICATION', notification, `user:${task.assigneeId}`);
            }

            // Broadcast comment event to org or task room (task room not joined yet, so org)
            // Or better: task:taskId. Client needs to join task room?
            // For now, broadcast to org so board/panels update?
            // Or specifically for comments, we might want real-time chat feel.
            // Let's stick to simple notification broadcast for MVP.

            return comment;
        }),

    update: protectedProcedure.input(updateCommentSchema).mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const [updated] = await ctx.db
            .update(comments)
            .set({ ...data, updatedAt: new Date() })
            .where(and(eq(comments.id, id), eq(comments.userId, ctx.user.id)))
            .returning();
        return updated;
    }),

    delete: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db
                .delete(comments)
                .where(and(eq(comments.id, input.id), eq(comments.userId, ctx.user.id)));
            return { success: true };
        }),
});

// ─── Document Router ────────────────────────────────────────────────
export const documentRouter = router({
    list: createOrgProcedure()
        .input(z.object({ orgId: z.string().uuid(), workspaceId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            return ctx.db.query.documents.findMany({
                where: eq(documents.workspaceId, input.workspaceId),
                orderBy: [desc(documents.updatedAt)],
            });
        }),

    create: createOrgProcedure('MEMBER')
        .input(createDocumentSchema)
        .mutation(async ({ ctx, input }) => {
            const [doc] = await ctx.db
                .insert(documents)
                .values({
                    ...input,
                    orgId: ctx.orgId!,
                    createdBy: ctx.user.id,
                })
                .returning();
            return doc;
        }),

    update: createOrgProcedure('MEMBER')
        .input(updateDocumentSchema)
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;
            const [updated] = await ctx.db
                .update(documents)
                .set({ ...data, updatedAt: new Date() })
                .where(eq(documents.id, id))
                .returning();
            return updated;
        }),

    delete: createOrgProcedure('ADMIN')
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db.delete(documents).where(eq(documents.id, input.id));
            return { success: true };
        }),
});

// ─── Notification Router ────────────────────────────────────────────
export const notificationRouter = router({
    list: protectedProcedure
        .input(z.object({ orgId: z.string().uuid().optional(), limit: z.number().optional() }))
        .query(async ({ ctx, input }) => {
            const conditions = [eq(notifications.userId, ctx.user.id)];
            if (input.orgId) conditions.push(eq(notifications.orgId, input.orgId));

            return ctx.db.query.notifications.findMany({
                where: and(...conditions),
                orderBy: [desc(notifications.createdAt)],
                limit: input.limit || 20,
            });
        }),

    getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
        const result = await ctx.db
            .select({ count: sql<number>`count(*)` })
            .from(notifications)
            .where(
                and(eq(notifications.userId, ctx.user.id), sql`${notifications.readAt} IS NULL`)
            );
        return result[0]?.count ?? 0;
    }),

    markRead: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db
                .update(notifications)
                .set({ readAt: new Date() })
                .where(and(eq(notifications.id, input.id), eq(notifications.userId, ctx.user.id)));
            return { success: true };
        }),

    markAllRead: protectedProcedure
        .input(z.object({ orgId: z.string().uuid().optional() }))
        .mutation(async ({ ctx, input }) => {
            const conditions = [
                eq(notifications.userId, ctx.user.id),
                sql`${notifications.readAt} IS NULL`,
            ];
            if (input.orgId) conditions.push(eq(notifications.orgId, input.orgId));

            await ctx.db.update(notifications).set({ readAt: new Date() }).where(and(...conditions));
            return { success: true };
        }),
});

// ─── App Router (combines all) ──────────────────────────────────────
export const appRouter = router({
    org: orgRouter,
    members: membersRouter,
    workspace: workspaceRouter,
    project: projectRouter,
    task: taskRouter,
    comment: commentRouter,
    document: documentRouter,
    notification: notificationRouter,
    billing: billingRouter,
});

export type AppRouter = typeof appRouter;
