import {
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
    integer,
    boolean,
    jsonb,
    index,
    uniqueIndex,
    pgEnum,
    serial,
    real,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Enums ──────────────────────────────────────────────────────────
export const orgRoleEnum = pgEnum('org_role', ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']);
export const projectStatusEnum = pgEnum('project_status', ['ACTIVE', 'ARCHIVED', 'DELETED']);
export const taskStatusEnum = pgEnum('task_status', ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']);
export const taskPriorityEnum = pgEnum('task_priority', ['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NONE']);
export const planEnum = pgEnum('plan', ['FREE', 'PRO', 'TEAM']);
export const subStatusEnum = pgEnum('sub_status', ['ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING']);
export const notificationTypeEnum = pgEnum('notification_type', [
    'TASK_ASSIGNED',
    'TASK_UPDATED',
    'COMMENT_ADDED',
    'INVITE_RECEIVED',
    'MENTION',
    'DUE_SOON',
]);

// ─── 1. Users ───────────────────────────────────────────────────────
export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    emailVerified: timestamp('email_verified', { mode: 'date' }),
    passwordHash: text('password_hash'),
    avatarUrl: text('avatar_url'),
    image: text('image'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// ─── 2. Accounts (for NextAuth OAuth) ───────────────────────────────
export const accounts = pgTable(
    'accounts',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        type: varchar('type', { length: 255 }).notNull(),
        provider: varchar('provider', { length: 255 }).notNull(),
        providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
        refreshToken: text('refresh_token'),
        accessToken: text('access_token'),
        expiresAt: integer('expires_at'),
        tokenType: varchar('token_type', { length: 255 }),
        scope: text('scope'),
        idToken: text('id_token'),
        sessionState: text('session_state'),
    },
    (table) => ({
        providerIdx: uniqueIndex('accounts_provider_account_idx').on(
            table.provider,
            table.providerAccountId
        ),
        userIdIdx: index('accounts_user_id_idx').on(table.userId),
    })
);

// ─── 3. Sessions (for NextAuth) ─────────────────────────────────────
export const sessions = pgTable(
    'sessions',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        sessionToken: text('session_token').notNull().unique(),
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        expires: timestamp('expires', { mode: 'date' }).notNull(),
    },
    (table) => ({
        userIdIdx: index('sessions_user_id_idx').on(table.userId),
    })
);

// ─── 4. Verification Tokens (for NextAuth) ──────────────────────────
export const verificationTokens = pgTable(
    'verification_tokens',
    {
        identifier: text('identifier').notNull(),
        token: text('token').notNull().unique(),
        expires: timestamp('expires', { mode: 'date' }).notNull(),
    },
    (table) => ({
        compoundKey: uniqueIndex('verification_tokens_identifier_token_idx').on(
            table.identifier,
            table.token
        ),
    })
);

// ─── 5. Organizations ───────────────────────────────────────────────
export const organizations = pgTable(
    'organizations',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        name: varchar('name', { length: 255 }).notNull(),
        slug: varchar('slug', { length: 255 }).notNull().unique(),
        logoUrl: text('logo_url'),
        plan: planEnum('plan').default('FREE').notNull(),
        stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
        createdBy: uuid('created_by')
            .notNull()
            .references(() => users.id),
        createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
    },
    (table) => ({
        slugIdx: uniqueIndex('organizations_slug_idx').on(table.slug),
    })
);

// ─── 6. Organization Members ────────────────────────────────────────
export const orgMembers = pgTable(
    'org_members',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        orgId: uuid('org_id')
            .notNull()
            .references(() => organizations.id, { onDelete: 'cascade' }),
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        role: orgRoleEnum('role').default('MEMBER').notNull(),
        invitedBy: uuid('invited_by').references(() => users.id),
        joinedAt: timestamp('joined_at', { mode: 'date' }).defaultNow().notNull(),
    },
    (table) => ({
        orgUserIdx: uniqueIndex('org_members_org_user_idx').on(table.orgId, table.userId),
        orgIdIdx: index('org_members_org_id_idx').on(table.orgId),
        userIdIdx: index('org_members_user_id_idx').on(table.userId),
    })
);

// ─── 7. Invitations ─────────────────────────────────────────────────
export const invitations = pgTable(
    'invitations',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        orgId: uuid('org_id')
            .notNull()
            .references(() => organizations.id, { onDelete: 'cascade' }),
        email: varchar('email', { length: 255 }).notNull(),
        role: orgRoleEnum('role').default('MEMBER').notNull(),
        token: varchar('token', { length: 255 }).notNull().unique(),
        invitedBy: uuid('invited_by')
            .notNull()
            .references(() => users.id),
        expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
        acceptedAt: timestamp('accepted_at', { mode: 'date' }),
        createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    },
    (table) => ({
        tokenIdx: uniqueIndex('invitations_token_idx').on(table.token),
        orgIdIdx: index('invitations_org_id_idx').on(table.orgId),
    })
);

// ─── 8. Workspaces ──────────────────────────────────────────────────
export const workspaces = pgTable(
    'workspaces',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        orgId: uuid('org_id')
            .notNull()
            .references(() => organizations.id, { onDelete: 'cascade' }),
        name: varchar('name', { length: 255 }).notNull(),
        slug: varchar('slug', { length: 255 }).notNull(),
        color: varchar('color', { length: 7 }).default('#6366f1'),
        createdBy: uuid('created_by')
            .notNull()
            .references(() => users.id),
        createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
    },
    (table) => ({
        orgSlugIdx: uniqueIndex('workspaces_org_slug_idx').on(table.orgId, table.slug),
        orgIdIdx: index('workspaces_org_id_idx').on(table.orgId),
    })
);

// ─── 9. Projects ────────────────────────────────────────────────────
export const projects = pgTable(
    'projects',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        workspaceId: uuid('workspace_id')
            .notNull()
            .references(() => workspaces.id, { onDelete: 'cascade' }),
        orgId: uuid('org_id')
            .notNull()
            .references(() => organizations.id, { onDelete: 'cascade' }),
        name: varchar('name', { length: 255 }).notNull(),
        slug: varchar('slug', { length: 255 }).notNull(),
        description: text('description'),
        status: projectStatusEnum('status').default('ACTIVE').notNull(),
        icon: varchar('icon', { length: 10 }),
        createdBy: uuid('created_by')
            .notNull()
            .references(() => users.id),
        createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
    },
    (table) => ({
        orgStatusIdx: index('projects_org_status_idx').on(table.orgId, table.status),
        workspaceIdx: index('projects_workspace_id_idx').on(table.workspaceId),
        orgSlugIdx: uniqueIndex('projects_org_slug_idx').on(table.orgId, table.slug),
    })
);

// ─── 10. Project Members ────────────────────────────────────────────
export const projectMembers = pgTable(
    'project_members',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        projectId: uuid('project_id')
            .notNull()
            .references(() => projects.id, { onDelete: 'cascade' }),
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        role: orgRoleEnum('role').default('MEMBER').notNull(),
        joinedAt: timestamp('joined_at', { mode: 'date' }).defaultNow().notNull(),
    },
    (table) => ({
        projectUserIdx: uniqueIndex('project_members_project_user_idx').on(
            table.projectId,
            table.userId
        ),
    })
);

// ─── 11. Tasks ──────────────────────────────────────────────────────
export const tasks = pgTable(
    'tasks',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        projectId: uuid('project_id')
            .notNull()
            .references(() => projects.id, { onDelete: 'cascade' }),
        orgId: uuid('org_id')
            .notNull()
            .references(() => organizations.id, { onDelete: 'cascade' }),
        title: varchar('title', { length: 500 }).notNull(),
        description: jsonb('description'), // Tiptap JSON content
        status: taskStatusEnum('status').default('TODO').notNull(),
        priority: taskPriorityEnum('priority').default('NONE').notNull(),
        position: integer('position').default(0).notNull(),
        assigneeId: uuid('assignee_id').references(() => users.id, { onDelete: 'set null' }),
        createdBy: uuid('created_by')
            .notNull()
            .references(() => users.id),
        dueDate: timestamp('due_date', { mode: 'date' }),
        completedAt: timestamp('completed_at', { mode: 'date' }),
        createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
    },
    (table) => ({
        projectStatusIdx: index('tasks_project_status_idx').on(table.projectId, table.status),
        orgIdIdx: index('tasks_org_id_idx').on(table.orgId),
        assigneeIdx: index('tasks_assignee_id_idx').on(table.assigneeId),
        dueDateIdx: index('tasks_due_date_idx').on(table.dueDate),
    })
);

// ─── 12. Task Labels ────────────────────────────────────────────────
export const taskLabels = pgTable(
    'task_labels',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        orgId: uuid('org_id')
            .notNull()
            .references(() => organizations.id, { onDelete: 'cascade' }),
        name: varchar('name', { length: 50 }).notNull(),
        color: varchar('color', { length: 7 }).notNull(),
        createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    },
    (table) => ({
        orgNameIdx: uniqueIndex('task_labels_org_name_idx').on(table.orgId, table.name),
    })
);

// ─── 13. Task Label Map (many-to-many) ──────────────────────────────
export const taskLabelMap = pgTable(
    'task_label_map',
    {
        taskId: uuid('task_id')
            .notNull()
            .references(() => tasks.id, { onDelete: 'cascade' }),
        labelId: uuid('label_id')
            .notNull()
            .references(() => taskLabels.id, { onDelete: 'cascade' }),
    },
    (table) => ({
        compoundKey: uniqueIndex('task_label_map_compound_idx').on(table.taskId, table.labelId),
    })
);

// ─── 14. Comments ───────────────────────────────────────────────────
export const comments = pgTable(
    'comments',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        taskId: uuid('task_id')
            .notNull()
            .references(() => tasks.id, { onDelete: 'cascade' }),
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        content: jsonb('content').notNull(), // Tiptap JSON
        createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
    },
    (table) => ({
        taskIdIdx: index('comments_task_id_idx').on(table.taskId),
    })
);

// ─── 15. Attachments ────────────────────────────────────────────────
export const attachments = pgTable(
    'attachments',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        taskId: uuid('task_id')
            .notNull()
            .references(() => tasks.id, { onDelete: 'cascade' }),
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id),
        url: text('url').notNull(),
        publicId: varchar('public_id', { length: 255 }),
        filename: varchar('filename', { length: 500 }).notNull(),
        size: integer('size').notNull(),
        mimeType: varchar('mime_type', { length: 100 }),
        createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    },
    (table) => ({
        taskIdIdx: index('attachments_task_id_idx').on(table.taskId),
    })
);

// ─── 16. Activity Log ───────────────────────────────────────────────
export const activityLog = pgTable(
    'activity_log',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        orgId: uuid('org_id')
            .notNull()
            .references(() => organizations.id, { onDelete: 'cascade' }),
        taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'set null' }),
        projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id),
        action: varchar('action', { length: 100 }).notNull(),
        metadata: jsonb('metadata'),
        createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    },
    (table) => ({
        orgIdIdx: index('activity_log_org_id_idx').on(table.orgId),
        taskIdIdx: index('activity_log_task_id_idx').on(table.taskId),
        createdAtIdx: index('activity_log_created_at_idx').on(table.createdAt),
    })
);

// ─── 17. Documents ──────────────────────────────────────────────────
export const documents = pgTable(
    'documents',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        workspaceId: uuid('workspace_id')
            .notNull()
            .references(() => workspaces.id, { onDelete: 'cascade' }),
        orgId: uuid('org_id')
            .notNull()
            .references(() => organizations.id, { onDelete: 'cascade' }),
        parentId: uuid('parent_id'), // self-referencing for nested docs
        title: varchar('title', { length: 500 }).notNull(),
        content: jsonb('content'), // Tiptap JSON
        icon: varchar('icon', { length: 10 }),
        createdBy: uuid('created_by')
            .notNull()
            .references(() => users.id),
        createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
    },
    (table) => ({
        workspaceIdx: index('documents_workspace_id_idx').on(table.workspaceId),
        orgIdIdx: index('documents_org_id_idx').on(table.orgId),
        parentIdx: index('documents_parent_id_idx').on(table.parentId),
    })
);

// ─── 18. Subscriptions ──────────────────────────────────────────────
export const subscriptions = pgTable(
    'subscriptions',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        orgId: uuid('org_id')
            .notNull()
            .references(() => organizations.id, { onDelete: 'cascade' })
            .unique(),
        stripeSubId: varchar('stripe_sub_id', { length: 255 }).unique(),
        plan: planEnum('plan').default('FREE').notNull(),
        status: subStatusEnum('status').default('ACTIVE').notNull(),
        currentPeriodEnd: timestamp('current_period_end', { mode: 'date' }),
        cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
        createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
    },
    (table) => ({
        orgIdIdx: uniqueIndex('subscriptions_org_id_idx').on(table.orgId),
        stripeSubIdx: uniqueIndex('subscriptions_stripe_sub_idx').on(table.stripeSubId),
    })
);

// ─── 19. Notifications ──────────────────────────────────────────────
export const notifications = pgTable(
    'notifications',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        orgId: uuid('org_id')
            .notNull()
            .references(() => organizations.id, { onDelete: 'cascade' }),
        type: notificationTypeEnum('type').notNull(),
        title: varchar('title', { length: 255 }).notNull(),
        body: text('body'),
        payload: jsonb('payload'),
        readAt: timestamp('read_at', { mode: 'date' }),
        createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    },
    (table) => ({
        userOrgIdx: index('notifications_user_org_idx').on(table.userId, table.orgId),
        readAtIdx: index('notifications_read_at_idx').on(table.readAt),
    })
);

// ═══════════════════════════════════════════════════════════════════
// RELATIONS
// ═══════════════════════════════════════════════════════════════════

export const usersRelations = relations(users, ({ many }) => ({
    orgMemberships: many(orgMembers),
    accounts: many(accounts),
    sessions: many(sessions),
    notifications: many(notifications),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
    user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const organizationsRelations = relations(organizations, ({ many, one }) => ({
    members: many(orgMembers),
    workspaces: many(workspaces),
    projects: many(projects),
    invitations: many(invitations),
    subscription: one(subscriptions),
    creator: one(users, { fields: [organizations.createdBy], references: [users.id] }),
}));

export const orgMembersRelations = relations(orgMembers, ({ one }) => ({
    organization: one(organizations, { fields: [orgMembers.orgId], references: [organizations.id] }),
    user: one(users, { fields: [orgMembers.userId], references: [users.id] }),
    inviter: one(users, { fields: [orgMembers.invitedBy], references: [users.id] }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
    organization: one(organizations, {
        fields: [invitations.orgId],
        references: [organizations.id],
    }),
    inviter: one(users, { fields: [invitations.invitedBy], references: [users.id] }),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [workspaces.orgId],
        references: [organizations.id],
    }),
    projects: many(projects),
    documents: many(documents),
    creator: one(users, { fields: [workspaces.createdBy], references: [users.id] }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
    workspace: one(workspaces, { fields: [projects.workspaceId], references: [workspaces.id] }),
    organization: one(organizations, { fields: [projects.orgId], references: [organizations.id] }),
    tasks: many(tasks),
    members: many(projectMembers),
    activityLogs: many(activityLog),
    creator: one(users, { fields: [projects.createdBy], references: [users.id] }),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
    project: one(projects, { fields: [projectMembers.projectId], references: [projects.id] }),
    user: one(users, { fields: [projectMembers.userId], references: [users.id] }),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
    project: one(projects, { fields: [tasks.projectId], references: [projects.id] }),
    organization: one(organizations, { fields: [tasks.orgId], references: [organizations.id] }),
    assignee: one(users, { fields: [tasks.assigneeId], references: [users.id] }),
    creator: one(users, { fields: [tasks.createdBy], references: [users.id] }),
    comments: many(comments),
    attachments: many(attachments),
    labels: many(taskLabelMap),
    activityLogs: many(activityLog),
}));

export const taskLabelsRelations = relations(taskLabels, ({ one, many }) => ({
    organization: one(organizations, { fields: [taskLabels.orgId], references: [organizations.id] }),
    taskMappings: many(taskLabelMap),
}));

export const taskLabelMapRelations = relations(taskLabelMap, ({ one }) => ({
    task: one(tasks, { fields: [taskLabelMap.taskId], references: [tasks.id] }),
    label: one(taskLabels, { fields: [taskLabelMap.labelId], references: [taskLabels.id] }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
    task: one(tasks, { fields: [comments.taskId], references: [tasks.id] }),
    user: one(users, { fields: [comments.userId], references: [users.id] }),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
    task: one(tasks, { fields: [attachments.taskId], references: [tasks.id] }),
    user: one(users, { fields: [attachments.userId], references: [users.id] }),
}));

export const activityLogRelations = relations(activityLog, ({ one }) => ({
    organization: one(organizations, {
        fields: [activityLog.orgId],
        references: [organizations.id],
    }),
    task: one(tasks, { fields: [activityLog.taskId], references: [tasks.id] }),
    project: one(projects, { fields: [activityLog.projectId], references: [projects.id] }),
    user: one(users, { fields: [activityLog.userId], references: [users.id] }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
    workspace: one(workspaces, { fields: [documents.workspaceId], references: [workspaces.id] }),
    organization: one(organizations, { fields: [documents.orgId], references: [organizations.id] }),
    creator: one(users, { fields: [documents.createdBy], references: [users.id] }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
    organization: one(organizations, {
        fields: [subscriptions.orgId],
        references: [organizations.id],
    }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
    user: one(users, { fields: [notifications.userId], references: [users.id] }),
    organization: one(organizations, {
        fields: [notifications.orgId],
        references: [organizations.id],
    }),
}));
