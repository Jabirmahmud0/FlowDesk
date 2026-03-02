import { router, publicProcedure, protectedProcedure, createOrgProcedure } from './trpc';
import { TRPCError } from '@trpc/server';
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
    documentVersions,
    documentComments,
    notifications,
    subscriptions,
    users,
    userSettings,
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
    createDocumentVersionSchema,
    restoreDocumentVersionSchema,
    createDocumentCommentSchema,
    updateDocumentCommentSchema,
    PLAN_LIMITS,
} from '@flowdesk/types';
import { eq, and, desc, asc, ilike, or, sql, inArray, gte, isNull } from 'drizzle-orm';
import { broadcast } from './lib/socket';
import { broadcastTask, broadcastComment, broadcastDocument } from './lib/socket-broadcast';
import { randomUUID } from 'crypto';
import { billingRouter } from './routers/billing';
import { attachmentsRouter } from './routers/attachments';
import { checkMemberLimit, checkProjectLimit, checkActivityHistoryLimit } from './lib/plan-limits';
import { sendInviteEmail } from './lib/email';

// ─── Activity Logging Helper ─────────────────────────────────────────
async function logActivity(
    db: any,
    data: {
        orgId: string;
        userId: string;
        action: string;
        taskId?: string | null;
        projectId?: string | null;
        documentId?: string | null;
        metadata?: Record<string, any>;
    }
) {
    await db.insert(activityLog).values({
        orgId: data.orgId,
        userId: data.userId,
        action: data.action,
        taskId: data.taskId || null,
        projectId: data.projectId || null,
        documentId: data.documentId || null,
        metadata: data.metadata || null,
    });
}

// ─── Notification Helper ────────────────────────────────────────────
async function createNotification(
    db: any,
    broadcast: any,
    data: {
        userId: string;
        orgId: string;
        type: string;
        title: string;
        body?: string;
        payload?: Record<string, any>;
    }
) {
    const [notification] = await db
        .insert(notifications)
        .values(data)
        .returning();

    // Broadcast to user
    await broadcast('NOTIFICATION', notification, `user:${data.userId}`);

    return notification;
}

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

            // Verify user is a member of this organization
            const isMember = org.members.some((m: any) => m.userId === ctx.user.id);
            if (!isMember) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You are not a member of this organization',
                });
            }

            return org;
        }),

    update: createOrgProcedure('ADMIN')
        .input(updateOrgSchema)
        .mutation(async ({ ctx, input }) => {
            const { orgId, ...data } = input;
            const [updated] = await ctx.db
                .update(organizations)
                .set({ ...data, updatedAt: new Date() })
                .where(eq(organizations.id, orgId))
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
            // Plan limit check
            await checkMemberLimit(ctx.db, input.orgId);

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

            // Send invite email via Resend
            const org = await ctx.db.query.organizations.findFirst({
                where: (o, { eq }) => eq(o.id, input.orgId),
            });
            const inviterName = ctx.user.name || ctx.user.email || 'A teammate';
            sendInviteEmail({
                to: input.email,
                inviterName,
                orgName: org?.name || 'your organization',
                inviteToken: token,
            }).catch((err) => console.error('[Email] Failed to send invite:', err));

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

    listInvitations: createOrgProcedure()
        .input(z.object({ orgId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            return ctx.db.query.invitations.findMany({
                where: eq(invitations.orgId, input.orgId),
                orderBy: [desc(invitations.createdAt)],
            });
        }),

    resendInvite: createOrgProcedure('ADMIN')
        .input(z.object({ orgId: z.string().uuid(), id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const invitation = await ctx.db.query.invitations.findFirst({
                where: eq(invitations.id, input.id),
            });

            if (!invitation) throw new Error('Invitation not found');

            // Update expiration
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            await ctx.db
                .update(invitations)
                .set({ expiresAt })
                .where(eq(invitations.id, input.id));

            // Resend email
            const org = await ctx.db.query.organizations.findFirst({
                where: (o, { eq }) => eq(o.id, input.orgId),
            });
            const inviterName = ctx.user.name || ctx.user.email || 'A teammate';
            sendInviteEmail({
                to: invitation.email,
                inviterName,
                orgName: org?.name || 'your organization',
                inviteToken: invitation.token,
            }).catch((err) => console.error('[Email] Failed to resend invite:', err));

            return { success: true };
        }),

    cancelInvite: createOrgProcedure('ADMIN')
        .input(z.object({ orgId: z.string().uuid(), id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db.delete(invitations).where(eq(invitations.id, input.id));
            return { success: true };
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
            // Plan limit check
            await checkProjectLimit(ctx.db, ctx.orgId!);

            const [project] = await ctx.db
                .insert(projects)
                .values({
                    ...input,
                    orgId: ctx.orgId!,
                    createdBy: ctx.user.id,
                })
                .returning();

            // Log activity
            await logActivity(ctx.db, {
                orgId: ctx.orgId!,
                userId: ctx.user.id,
                action: 'PROJECT_CREATED',
                projectId: project.id,
                metadata: { name: project.name, status: project.status },
            });

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

            const [currentProject] = await ctx.db
                .select()
                .from(projects)
                .where(eq(projects.id, id));

            const [updated] = await ctx.db
                .update(projects)
                .set({ ...data, updatedAt: new Date() })
                .where(eq(projects.id, id))
                .returning();

            // Log activity for status change
            if (data.status && data.status !== currentProject?.status) {
                await logActivity(ctx.db, {
                    orgId: ctx.orgId!,
                    userId: ctx.user.id,
                    action: 'PROJECT_STATUS_CHANGED',
                    projectId: updated.id,
                    metadata: {
                        from: currentProject?.status,
                        to: updated.status,
                        name: updated.name
                    },
                });
            }

            return updated;
        }),

    delete: createOrgProcedure('ADMIN')
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            // Get project info before deletion
            const [deletedProject] = await ctx.db
                .select()
                .from(projects)
                .where(eq(projects.id, input.id));

            await ctx.db.delete(projects).where(eq(projects.id, input.id));

            // Log activity
            if (deletedProject) {
                await logActivity(ctx.db, {
                    orgId: ctx.orgId!,
                    userId: ctx.user.id,
                    action: 'PROJECT_DELETED',
                    projectId: input.id,
                    metadata: { name: deletedProject.name },
                });
            }

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

            // Log activity
            await logActivity(ctx.db, {
                orgId: ctx.orgId!,
                userId: ctx.user.id,
                action: 'TASK_CREATED',
                taskId: task.id,
                projectId: task.projectId,
                metadata: { title: task.title, status: task.status },
            });

            // Broadcast to project room for real-time updates
            await broadcastTask.created(task, task.projectId);

            // Notify assignee
            if (input.assigneeId && input.assigneeId !== ctx.user.id) {
                await createNotification(ctx.db, broadcast, {
                    userId: input.assigneeId,
                    orgId: ctx.orgId!,
                    type: 'TASK_ASSIGNED',
                    title: 'New Task Assigned',
                    body: `You have been assigned to task "${task.title}"`,
                    payload: { taskId: task.id, projectId: task.projectId },
                });
            }

            return task;
        }),

    get: createOrgProcedure()
        .input(z.object({ id: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            return ctx.db.query.tasks.findFirst({
                where: eq(tasks.id, input.id),
                with: {
                    assignee: true,
                    labels: { with: { label: true } },
                    project: true,
                },
            });
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

            // Log activity for status change
            if (data.status && data.status !== currentTask?.status) {
                await logActivity(ctx.db, {
                    orgId: ctx.orgId!,
                    userId: ctx.user.id,
                    action: 'TASK_STATUS_CHANGED',
                    taskId: updated.id,
                    projectId: updated.projectId,
                    metadata: {
                        from: currentTask?.status,
                        to: updated.status,
                        title: updated.title
                    },
                });
            }

            // Log activity for assignee change
            if (data.assigneeId && data.assigneeId !== currentTask?.assigneeId) {
                await logActivity(ctx.db, {
                    orgId: ctx.orgId!,
                    userId: ctx.user.id,
                    action: 'TASK_ASSIGNEE_CHANGED',
                    taskId: updated.id,
                    projectId: updated.projectId,
                    metadata: {
                        from: currentTask?.assigneeId,
                        to: updated.assigneeId,
                        title: updated.title
                    },
                });
            }

            // Notify on reassignment
            if (
                input.assigneeId &&
                input.assigneeId !== ctx.user.id &&
                input.assigneeId !== currentTask?.assigneeId
            ) {
                await createNotification(ctx.db, broadcast, {
                    userId: input.assigneeId,
                    orgId: ctx.orgId!,
                    type: 'TASK_ASSIGNED',
                    title: 'Task Assigned',
                    body: `You have been assigned to task "${updated.title}"`,
                    payload: { taskId: updated.id, projectId: updated.projectId },
                });
            }

            // Broadcast task update to project room for real-time updates
            await broadcastTask.updated(updated, updated.projectId);

            return updated;
        }),

    move: createOrgProcedure('MEMBER')
        .input(moveTaskSchema)
        .mutation(async ({ ctx, input }) => {
            const [currentTask] = await ctx.db
                .select()
                .from(tasks)
                .where(eq(tasks.id, input.id));

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

            // Log activity
            await logActivity(ctx.db, {
                orgId: ctx.orgId!,
                userId: ctx.user.id,
                action: 'TASK_MOVED',
                taskId: moved.id,
                projectId: moved.projectId,
                metadata: {
                    from: currentTask?.status,
                    to: moved.status,
                    title: moved.title
                },
            });

            // Broadcast task move to project room for real-time Kanban updates
            await broadcastTask.moved(moved.id, currentTask?.status || '', moved.status, moved.projectId);

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
            // Get task info before deletion
            const [deletedTask] = await ctx.db
                .select()
                .from(tasks)
                .where(eq(tasks.id, input.id));

            await ctx.db.delete(tasks).where(eq(tasks.id, input.id));

            // Log activity
            if (deletedTask) {
                await logActivity(ctx.db, {
                    orgId: ctx.orgId!,
                    userId: ctx.user.id,
                    action: 'TASK_DELETED',
                    taskId: input.id,
                    projectId: deletedTask.projectId,
                    metadata: { title: deletedTask.title },
                });

                // Broadcast task deletion to project room
                await broadcastTask.deleted(input.id, deletedTask.projectId);
            }

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

            // Get task for notification and activity logging
            const task = await ctx.db.query.tasks.findFirst({
                where: eq(tasks.id, input.taskId),
            });

            // Log activity
            if (task) {
                await logActivity(ctx.db, {
                    orgId: ctx.orgId!,
                    userId: ctx.user.id,
                    action: 'COMMENT_ADDED',
                    taskId: task.id,
                    projectId: task.projectId,
                    metadata: { commentId: comment.id, taskId: task.id },
                });
            }

            // Notify assignee
            if (task && task.assigneeId && task.assigneeId !== ctx.user.id) {
                await createNotification(ctx.db, broadcast, {
                    userId: task.assigneeId,
                    orgId: ctx.orgId!,
                    type: 'COMMENT_ADDED',
                    title: 'New Comment',
                    body: `New comment on task "${task.title}"`,
                    payload: { taskId: task.id, projectId: task.projectId, commentId: comment.id },
                });
            }

            // Broadcast comment to task room for real-time updates
            await broadcastComment.added(comment, input.taskId);

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
            // Get comment before deletion for activity logging
            const [deletedComment] = await ctx.db
                .select()
                .from(comments)
                .where(and(eq(comments.id, input.id), eq(comments.userId, ctx.user.id)));

            await ctx.db
                .delete(comments)
                .where(and(eq(comments.id, input.id), eq(comments.userId, ctx.user.id)));

            // Log activity
            if (deletedComment) {
                await logActivity(ctx.db, {
                    orgId: ctx.orgId!,
                    userId: ctx.user.id,
                    action: 'COMMENT_DELETED',
                    taskId: deletedComment.taskId,
                    metadata: { commentId: input.id },
                });
            }

            return { success: true };
        }),
});

// ─── Document Router ────────────────────────────────────────────────
export const documentRouter = router({
    get: createOrgProcedure()
        .input(z.object({ orgId: z.string().uuid(), id: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const doc = await ctx.db.query.documents.findFirst({
                where: and(eq(documents.orgId, input.orgId), eq(documents.id, input.id)),
            });
            if (!doc) throw new Error('Document not found');
            return doc;
        }),

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

            // Log activity
            await logActivity(ctx.db, {
                orgId: ctx.orgId!,
                userId: ctx.user.id,
                action: 'DOCUMENT_CREATED',
                documentId: doc.id,
                metadata: { title: doc.title, workspaceId: doc.workspaceId },
            });

            return doc;
        }),

    update: createOrgProcedure('MEMBER')
        .input(updateDocumentSchema)
        .mutation(async ({ ctx, input }) => {
            const { id, changeNote, ...data } = input;

            // Get current document for version history
            const currentDoc = await ctx.db.query.documents.findFirst({
                where: eq(documents.id, id),
            });

            if (!currentDoc) throw new Error('Document not found');

            // Create version before updating
            const existingVersions = await ctx.db.query.documentVersions.findMany({
                where: eq(documentVersions.documentId, id),
                orderBy: [desc(documentVersions.versionNumber)],
                limit: 1,
            });

            const nextVersionNumber = (existingVersions[0]?.versionNumber || 0) + 1;

            await ctx.db.insert(documentVersions).values({
                documentId: id,
                orgId: ctx.orgId!,
                versionNumber: nextVersionNumber,
                title: currentDoc.title,
                content: currentDoc.content,
                createdBy: ctx.user.id,
                changeNote: changeNote || `Version ${nextVersionNumber}`,
            });

            const [updated] = await ctx.db
                .update(documents)
                .set({ ...data, updatedAt: new Date() })
                .where(eq(documents.id, id))
                .returning();

            // Log activity
            await logActivity(ctx.db, {
                orgId: ctx.orgId!,
                userId: ctx.user.id,
                action: 'DOCUMENT_UPDATED',
                documentId: updated.id,
                metadata: {
                    title: updated.title,
                    version: nextVersionNumber,
                    changeNote
                },
            });

            return updated;
        }),

    delete: createOrgProcedure('ADMIN')
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            // Get document info before deletion
            const [deletedDoc] = await ctx.db
                .select()
                .from(documents)
                .where(eq(documents.id, input.id));

            await ctx.db.delete(documents).where(eq(documents.id, input.id));

            // Log activity
            if (deletedDoc) {
                await logActivity(ctx.db, {
                    orgId: ctx.orgId!,
                    userId: ctx.user.id,
                    action: 'DOCUMENT_DELETED',
                    documentId: input.id,
                    metadata: { title: deletedDoc.title },
                });
            }

            return { success: true };
        }),

    // Version History Endpoints
    getVersions: createOrgProcedure()
        .input(z.object({ orgId: z.string().uuid(), documentId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            return ctx.db.query.documentVersions.findMany({
                where: eq(documentVersions.documentId, input.documentId),
                orderBy: [desc(documentVersions.versionNumber)],
                with: {
                    creator: true,
                },
            });
        }),

    getVersion: createOrgProcedure()
        .input(z.object({ orgId: z.string().uuid(), versionId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const version = await ctx.db.query.documentVersions.findFirst({
                where: and(
                    eq(documentVersions.id, input.versionId),
                    eq(documentVersions.orgId, input.orgId)
                ),
            });
            if (!version) throw new Error('Version not found');
            return version;
        }),

    restoreVersion: createOrgProcedure('MEMBER')
        .input(restoreDocumentVersionSchema)
        .mutation(async ({ ctx, input }) => {
            const version = await ctx.db.query.documentVersions.findFirst({
                where: and(
                    eq(documentVersions.id, input.versionId),
                    eq(documentVersions.orgId, input.orgId)
                ),
            });

            if (!version) throw new Error('Version not found');

            // Get current document
            const currentDoc = await ctx.db.query.documents.findFirst({
                where: eq(documents.id, version.documentId),
            });

            if (!currentDoc) throw new Error('Document not found');

            // Save current state as version before restoring
            const existingVersions = await ctx.db.query.documentVersions.findMany({
                where: eq(documentVersions.documentId, version.documentId),
                orderBy: [desc(documentVersions.versionNumber)],
                limit: 1,
            });

            const nextVersionNumber = (existingVersions[0]?.versionNumber || 0) + 1;

            await ctx.db.insert(documentVersions).values({
                documentId: version.documentId,
                orgId: input.orgId,
                versionNumber: nextVersionNumber,
                title: currentDoc.title,
                content: currentDoc.content,
                createdBy: ctx.user.id,
                changeNote: `Restored from version ${version.versionNumber}`,
            });

            // Restore the version
            await ctx.db
                .update(documents)
                .set({
                    title: version.title,
                    content: version.content,
                    updatedAt: new Date(),
                })
                .where(eq(documents.id, version.documentId));

            return { success: true, restoredVersion: version.versionNumber };
        }),

    deleteVersion: createOrgProcedure('ADMIN')
        .input(z.object({ orgId: z.string().uuid(), versionId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db.delete(documentVersions).where(eq(documentVersions.id, input.versionId));
            return { success: true };
        }),

    // Document Comments Endpoints
    getComments: createOrgProcedure()
        .input(z.object({ orgId: z.string().uuid(), documentId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            return ctx.db.query.documentComments.findMany({
                where: and(
                    eq(documentComments.documentId, input.documentId),
                    eq(documentComments.orgId, input.orgId),
                    isNull(documentComments.parentId) // Only top-level comments
                ),
                orderBy: [desc(documentComments.createdAt)],
                with: {
                    user: true,
                    replies: {
                        orderBy: [asc(documentComments.createdAt)],
                        with: {
                            user: true,
                        },
                    },
                },
            });
        }),

    createComment: createOrgProcedure('MEMBER')
        .input(createDocumentCommentSchema)
        .mutation(async ({ ctx, input }) => {
            const [comment] = await ctx.db
                .insert(documentComments)
                .values({
                    ...input,
                    userId: ctx.user.id,
                })
                .returning();

            // Log activity
            await logActivity(ctx.db, {
                orgId: ctx.orgId!,
                userId: ctx.user.id,
                action: input.parentId ? 'DOCUMENT_COMMENT_REPLY' : 'DOCUMENT_COMMENT_ADDED',
                documentId: input.documentId,
                metadata: {
                    commentId: comment.id,
                    documentId: input.documentId,
                    parentId: input.parentId
                },
            });

            return comment;
        }),

    updateComment: createOrgProcedure('MEMBER')
        .input(updateDocumentCommentSchema)
        .mutation(async ({ ctx, input }) => {
            const { id, content, resolved, ...rest } = input;

            // Get current comment for activity logging
            const [currentComment] = await ctx.db
                .select()
                .from(documentComments)
                .where(eq(documentComments.id, id));

            const updateData: Record<string, any> = { ...rest };
            if (content !== undefined) updateData.content = content;
            if (resolved !== undefined) {
                if (resolved) {
                    updateData.resolvedAt = new Date();
                    updateData.resolvedBy = ctx.user.id;
                } else {
                    updateData.resolvedAt = null;
                    updateData.resolvedBy = null;
                }
            }

            const [updated] = await ctx.db
                .update(documentComments)
                .set({ ...updateData, updatedAt: new Date() })
                .where(eq(documentComments.id, id))
                .returning();

            // Log activity for comment resolution
            if (resolved !== undefined && currentComment) {
                await logActivity(ctx.db, {
                    orgId: ctx.orgId!,
                    userId: ctx.user.id,
                    action: resolved ? 'DOCUMENT_COMMENT_RESOLVED' : 'DOCUMENT_COMMENT_REOPENED',
                    documentId: currentComment.documentId,
                    metadata: { commentId: id, documentId: currentComment.documentId },
                });
            }

            return updated;
        }),

    deleteComment: createOrgProcedure('MEMBER')
        .input(z.object({ orgId: z.string().uuid(), id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            // Get comment before deletion for activity logging
            const [deletedComment] = await ctx.db
                .select()
                .from(documentComments)
                .where(eq(documentComments.id, input.id));

            await ctx.db.delete(documentComments).where(eq(documentComments.id, input.id));

            // Log activity
            if (deletedComment) {
                await logActivity(ctx.db, {
                    orgId: ctx.orgId!,
                    userId: ctx.user.id,
                    action: 'DOCUMENT_COMMENT_DELETED',
                    documentId: deletedComment.documentId,
                    metadata: { commentId: input.id, documentId: deletedComment.documentId },
                });
            }

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

    delete: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db
                .delete(notifications)
                .where(and(eq(notifications.id, input.id), eq(notifications.userId, ctx.user.id)));
            return { success: true };
        }),
});

// ─── Activity Router ────────────────────────────────────────────────
export const activityRouter = router({
    list: protectedProcedure
        .input(z.object({
            orgId: z.string().uuid(),
            limit: z.number().optional(),
            userId: z.string().uuid().optional(),
            action: z.string().optional(),
            projectId: z.string().uuid().optional(),
            taskId: z.string().uuid().optional(),
            documentId: z.string().uuid().optional(),
        }))
        .query(async ({ ctx, input }) => {
            const conditions = [eq(activityLog.orgId, input.orgId)];
            if (input.userId) conditions.push(eq(activityLog.userId, input.userId));
            if (input.action) conditions.push(eq(activityLog.action, input.action));
            if (input.projectId) conditions.push(eq(activityLog.projectId, input.projectId));
            if (input.taskId) conditions.push(eq(activityLog.taskId, input.taskId));
            if (input.documentId) conditions.push(eq(activityLog.documentId, input.documentId));

            // Apply plan-based activity history limit
            const historyDays = await checkActivityHistoryLimit(ctx.db, input.orgId);
            if (historyDays > 0) {
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - historyDays);
                conditions.push(gte(activityLog.createdAt, cutoffDate));
            }

            return ctx.db.query.activityLog.findMany({
                where: and(...conditions),
                with: { user: true, project: true, task: true, document: true },
                orderBy: [desc(activityLog.createdAt)],
                limit: input.limit || 50,
            });
        }),

    getByTask: protectedProcedure
        .input(z.object({ orgId: z.string().uuid(), taskId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            // Apply plan-based activity history limit
            const historyDays = await checkActivityHistoryLimit(ctx.db, input.orgId);
            const conditions = [eq(activityLog.orgId, input.orgId), eq(activityLog.taskId, input.taskId)];
            if (historyDays > 0) {
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - historyDays);
                conditions.push(gte(activityLog.createdAt, cutoffDate));
            }

            return ctx.db.query.activityLog.findMany({
                where: and(...conditions),
                with: { user: true, task: true },
                orderBy: [desc(activityLog.createdAt)],
                limit: 50,
            });
        }),

    getByProject: protectedProcedure
        .input(z.object({ orgId: z.string().uuid(), projectId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            // Apply plan-based activity history limit
            const historyDays = await checkActivityHistoryLimit(ctx.db, input.orgId);
            const conditions = [eq(activityLog.orgId, input.orgId), eq(activityLog.projectId, input.projectId)];
            if (historyDays > 0) {
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - historyDays);
                conditions.push(gte(activityLog.createdAt, cutoffDate));
            }

            return ctx.db.query.activityLog.findMany({
                where: and(...conditions),
                with: { user: true, task: true },
                orderBy: [desc(activityLog.createdAt)],
                limit: 50,
            });
        }),

    getByDocument: protectedProcedure
        .input(z.object({ orgId: z.string().uuid(), documentId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            // Apply plan-based activity history limit
            const historyDays = await checkActivityHistoryLimit(ctx.db, input.orgId);
            const conditions = [eq(activityLog.orgId, input.orgId), eq(activityLog.documentId, input.documentId)];
            if (historyDays > 0) {
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - historyDays);
                conditions.push(gte(activityLog.createdAt, cutoffDate));
            }

            return ctx.db.query.activityLog.findMany({
                where: and(...conditions),
                with: { user: true },
                orderBy: [desc(activityLog.createdAt)],
                limit: 50,
            });
        }),
});

// ─── Labels Router ──────────────────────────────────────────────────
export const labelRouter = router({
    listByOrg: createOrgProcedure()
        .input(z.object({ orgId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            return ctx.db.query.taskLabels.findMany({
                where: eq(taskLabels.orgId, input.orgId),
                orderBy: [asc(taskLabels.name)],
            });
        }),

    create: createOrgProcedure('MEMBER')
        .input(z.object({ orgId: z.string().uuid(), name: z.string().min(1).max(50), color: z.string().regex(/^#[0-9a-fA-F]{6}$/) }))
        .mutation(async ({ ctx, input }) => {
            const [label] = await ctx.db
                .insert(taskLabels)
                .values({ orgId: input.orgId, name: input.name, color: input.color })
                .returning();
            return label;
        }),

    delete: createOrgProcedure('ADMIN')
        .input(z.object({ orgId: z.string().uuid(), id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db.delete(taskLabels).where(eq(taskLabels.id, input.id));
            return { success: true };
        }),

    assign: createOrgProcedure('MEMBER')
        .input(z.object({ orgId: z.string().uuid(), taskId: z.string().uuid(), labelId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const [mapping] = await ctx.db
                .insert(taskLabelMap)
                .values({ taskId: input.taskId, labelId: input.labelId })
                .returning();
            return mapping;
        }),

    remove: createOrgProcedure('MEMBER')
        .input(z.object({ orgId: z.string().uuid(), taskId: z.string().uuid(), labelId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db
                .delete(taskLabelMap)
                .where(and(eq(taskLabelMap.taskId, input.taskId), eq(taskLabelMap.labelId, input.labelId)));
            return { success: true };
        }),
});

// ─── Attachments Router ─────────────────────────────────────────────
export const attachmentRouter = router({
    listByTask: createOrgProcedure()
        .input(z.object({ orgId: z.string().uuid(), taskId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            return ctx.db.query.attachments.findMany({
                where: eq(attachments.taskId, input.taskId),
                with: { user: true },
                orderBy: [desc(attachments.createdAt)],
            });
        }),

    create: createOrgProcedure('MEMBER')
        .input(z.object({
            orgId: z.string().uuid(),
            taskId: z.string().uuid(),
            url: z.string().url(),
            publicId: z.string().optional(),
            filename: z.string().min(1),
            size: z.number().int().min(0),
        }))
        .mutation(async ({ ctx, input }) => {
            const [attachment] = await ctx.db
                .insert(attachments)
                .values({
                    taskId: input.taskId,
                    userId: ctx.user.id,
                    url: input.url,
                    publicId: input.publicId || null,
                    filename: input.filename,
                    size: input.size,
                })
                .returning();
            return attachment;
        }),

    delete: createOrgProcedure('MEMBER')
        .input(z.object({ orgId: z.string().uuid(), id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db.delete(attachments).where(eq(attachments.id, input.id));
            return { success: true };
        }),
});

// ─── Analytics Router ───────────────────────────────────────────────
export const analyticsRouter = router({
    getDashboardStats: createOrgProcedure()
        .input(z.object({ orgId: z.string().uuid(), days: z.number().int().min(7).max(365).optional() }))
        .query(async ({ ctx, input }) => {
            const days = input.days || 30;
            const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

            // Total tasks
            const totalTasksResult = await ctx.db
                .select({ count: sql<number>`count(*)::int` })
                .from(tasks)
                .where(eq(tasks.orgId, input.orgId));

            // Completed tasks
            const completedTasksResult = await ctx.db
                .select({ count: sql<number>`count(*)::int` })
                .from(tasks)
                .where(and(eq(tasks.orgId, input.orgId), eq(tasks.status, 'DONE')));

            // In progress tasks
            const inProgressResult = await ctx.db
                .select({ count: sql<number>`count(*)::int` })
                .from(tasks)
                .where(and(eq(tasks.orgId, input.orgId), eq(tasks.status, 'IN_PROGRESS')));

            // Overdue tasks
            const overdueResult = await ctx.db
                .select({ count: sql<number>`count(*)::int` })
                .from(tasks)
                .where(
                    and(
                        eq(tasks.orgId, input.orgId),
                        eq(tasks.status, 'IN_PROGRESS'),
                        sql`${tasks.dueDate} < NOW()`
                    )
                );

            return {
                totalTasks: totalTasksResult[0]?.count || 0,
                completedTasks: completedTasksResult[0]?.count || 0,
                inProgressTasks: inProgressResult[0]?.count || 0,
                overdueTasks: overdueResult[0]?.count || 0,
            };
        }),

    getVelocity: createOrgProcedure()
        .input(z.object({ orgId: z.string().uuid(), days: z.number().int().min(7).max(365).optional() }))
        .query(async ({ ctx, input }) => {
            const days = input.days || 30;
            const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

            const result = await ctx.db
                .select({
                    week: sql<string>`to_char(${tasks.completedAt}, 'IYYY-IW')`,
                    count: sql<number>`count(*)::int`,
                })
                .from(tasks)
                .where(
                    and(
                        eq(tasks.orgId, input.orgId),
                        eq(tasks.status, 'DONE'),
                        gte(tasks.completedAt, since)
                    )
                )
                .groupBy(sql`to_char(${tasks.completedAt}, 'IYYY-IW')`)
                .orderBy(sql`to_char(${tasks.completedAt}, 'IYYY-IW')`);

            // Format for charts - ensure consistent structure
            return result.map(r => ({
                week: `Week ${r.week.split('-')[1]}`,
                completed: r.count,
            }));
        }),

    getTaskCompletion: createOrgProcedure()
        .input(z.object({ orgId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const statusCounts = await ctx.db
                .select({
                    status: tasks.status,
                    count: sql<number>`count(*)::int`,
                })
                .from(tasks)
                .where(eq(tasks.orgId, input.orgId))
                .groupBy(tasks.status);

            const total = statusCounts.reduce((sum, s) => sum + s.count, 0);
            const done = statusCounts.find(s => s.status === 'DONE')?.count || 0;
            const overdue = await ctx.db
                .select({ count: sql<number>`count(*)::int` })
                .from(tasks)
                .where(
                    and(
                        eq(tasks.orgId, input.orgId),
                        sql`${tasks.status} != 'DONE'`,
                        sql`${tasks.dueDate} < NOW()`
                    )
                );

            return {
                statusCounts,
                total,
                done,
                completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
                overdue: overdue[0]?.count || 0,
            };
        }),

    getMemberActivity: createOrgProcedure()
        .input(z.object({ orgId: z.string().uuid(), days: z.number().int().optional() }))
        .query(async ({ ctx, input }) => {
            const days = input.days || 30;
            const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

            const result = await ctx.db
                .select({
                    date: sql<string>`to_char(${activityLog.createdAt}, 'YYYY-MM-DD')`,
                    count: sql<number>`count(*)::int`,
                })
                .from(activityLog)
                .where(
                    and(
                        eq(activityLog.orgId, input.orgId),
                        gte(activityLog.createdAt, since)
                    )
                )
                .groupBy(sql`to_char(${activityLog.createdAt}, 'YYYY-MM-DD')`)
                .orderBy(sql`to_char(${activityLog.createdAt}, 'YYYY-MM-DD')`);

            // Format for charts
            return result.map(r => ({
                date: r.date,
                count: r.count,
            }));
        }),
});

// ─── Search Router ──────────────────────────────────────────────────
export const searchRouter = router({
    global: createOrgProcedure()
        .input(z.object({ orgId: z.string().uuid(), query: z.string().min(1).max(200) }))
        .query(async ({ ctx, input }) => {
            const q = `%${input.query}%`;

            const [matchedTasks, matchedDocs, matchedComments] = await Promise.all([
                ctx.db.query.tasks.findMany({
                    where: and(
                        eq(tasks.orgId, input.orgId),
                        ilike(tasks.title, q)
                    ),
                    with: { assignee: true, project: true },
                    limit: 10,
                }),
                ctx.db.query.documents.findMany({
                    where: and(
                        eq(documents.orgId, input.orgId),
                        ilike(documents.title, q)
                    ),
                    limit: 10,
                }),
                ctx.db
                    .select({
                        id: comments.id,
                        taskId: comments.taskId,
                        content: comments.content,
                        createdAt: comments.createdAt,
                    })
                    .from(comments)
                    .innerJoin(tasks, eq(comments.taskId, tasks.id))
                    .where(
                        and(
                            eq(tasks.orgId, input.orgId),
                            sql`${comments.content}::text ILIKE ${q}`
                        )
                    )
                    .limit(5),
            ]);

            return {
                tasks: matchedTasks,
                documents: matchedDocs,
                comments: matchedComments,
            };
        }),
});

// ─── User Router ────────────────────────────────────────────────
export const userRouter = router({
    getProfile: protectedProcedure.query(async ({ ctx }) => {
        const user = await ctx.db.query.users.findFirst({
            where: eq(users.id, ctx.user.id),
        });
        if (!user) throw new Error('User not found');
        return user;
    }),

    updateProfile: protectedProcedure
        .input(z.object({
            name: z.string().min(1).max(255).optional(),
            email: z.string().email().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const updateData: Record<string, string> = {};
            if (input.name) updateData.name = input.name;
            if (input.email) updateData.email = input.email;

            if (Object.keys(updateData).length === 0) {
                throw new Error('No fields to update');
            }

            const [updated] = await ctx.db
                .update(users)
                .set({ ...updateData, updatedAt: new Date() })
                .where(eq(users.id, ctx.user.id))
                .returning();
            return updated;
        }),

    getNotificationSettings: protectedProcedure.query(async ({ ctx }) => {
        const settings = await ctx.db.query.userSettings.findFirst({
            where: eq(userSettings.userId, ctx.user.id),
        });

        // Return default settings if none exist
        if (!settings) {
            return {
                emailNotifications: true,
                taskAssignments: true,
                taskUpdates: true,
                comments: true,
                mentions: true,
                dueSoon: true,
            };
        }

        return settings;
    }),

    updateNotificationSettings: protectedProcedure
        .input(z.object({
            emailNotifications: z.boolean().optional(),
            taskAssignments: z.boolean().optional(),
            taskUpdates: z.boolean().optional(),
            comments: z.boolean().optional(),
            mentions: z.boolean().optional(),
            dueSoon: z.boolean().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const updateData: Record<string, boolean> = {};
            if (input.emailNotifications !== undefined) updateData.emailNotifications = input.emailNotifications;
            if (input.taskAssignments !== undefined) updateData.taskAssignments = input.taskAssignments;
            if (input.taskUpdates !== undefined) updateData.taskUpdates = input.taskUpdates;
            if (input.comments !== undefined) updateData.comments = input.comments;
            if (input.mentions !== undefined) updateData.mentions = input.mentions;
            if (input.dueSoon !== undefined) updateData.dueSoon = input.dueSoon;

            // Upsert: insert or update
            await ctx.db
                .insert(userSettings)
                .values({
                    userId: ctx.user.id,
                    ...updateData,
                    updatedAt: new Date(),
                })
                .onConflictDoUpdate({
                    target: userSettings.userId,
                    set: { ...updateData, updatedAt: new Date() },
                });

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
    attachments: attachmentsRouter,
    comment: commentRouter,
    document: documentRouter,
    notification: notificationRouter,
    billing: billingRouter,
    activity: activityRouter,
    label: labelRouter,
    attachment: attachmentRouter,
    analytics: analyticsRouter,
    search: searchRouter,
    user: userRouter,
});

export type AppRouter = typeof appRouter;
