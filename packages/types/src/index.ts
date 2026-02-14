import { z } from 'zod';

// ─── Auth Schemas ───────────────────────────────────────────────────
export const signUpSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const signInSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

// ─── Organization Schemas ───────────────────────────────────────────
export const createOrgSchema = z.object({
    name: z.string().min(2).max(100),
    slug: z
        .string()
        .min(2)
        .max(50)
        .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
});

export const updateOrgSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(2).max(100).optional(),
    slug: z
        .string()
        .min(2)
        .max(50)
        .regex(/^[a-z0-9-]+$/)
        .optional(),
    logoUrl: z.string().url().optional().nullable(),
});

// ─── Workspace Schemas ───────────────────────────────────────────────
export const createWorkspaceSchema = z.object({
    orgId: z.string().uuid(),
    name: z.string().min(1).max(100),
    slug: z
        .string()
        .min(1)
        .max(50)
        .regex(/^[a-z0-9-]+$/),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export const updateWorkspaceSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(100).optional(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

// ─── Project Schemas ────────────────────────────────────────────────
export const createProjectSchema = z.object({
    workspaceId: z.string().uuid(),
    name: z.string().min(1).max(255),
    slug: z
        .string()
        .min(1)
        .max(100)
        .regex(/^[a-z0-9-]+$/),
    description: z.string().max(1000).optional(),
    icon: z.string().max(10).optional(),
});

export const updateProjectSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).optional().nullable(),
    status: z.enum(['ACTIVE', 'ARCHIVED', 'DELETED']).optional(),
    icon: z.string().max(10).optional(),
});

// ─── Task Schemas ───────────────────────────────────────────────────
export const createTaskSchema = z.object({
    projectId: z.string().uuid(),
    title: z.string().min(1).max(500),
    description: z.any().optional(), // Tiptap JSON
    status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).optional(),
    priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NONE']).optional(),
    assigneeId: z.string().uuid().optional().nullable(),
    dueDate: z.string().datetime().optional().nullable(),
});

export const updateTaskSchema = z.object({
    id: z.string().uuid(),
    title: z.string().min(1).max(500).optional(),
    description: z.any().optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).optional(),
    priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NONE']).optional(),
    assigneeId: z.string().uuid().optional().nullable(),
    dueDate: z.string().datetime().optional().nullable(),
});

export const moveTaskSchema = z.object({
    id: z.string().uuid(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']),
    position: z.number().int().min(0),
});

export const bulkUpdateTasksSchema = z.object({
    ids: z.array(z.string().uuid()).min(1),
    status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).optional(),
    assigneeId: z.string().uuid().optional().nullable(),
    priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NONE']).optional(),
});

// ─── Comment Schemas ────────────────────────────────────────────────
export const createCommentSchema = z.object({
    taskId: z.string().uuid(),
    content: z.any(), // Tiptap JSON
});

export const updateCommentSchema = z.object({
    id: z.string().uuid(),
    content: z.any(),
});

// ─── Invitation Schemas ─────────────────────────────────────────────
export const inviteMemberSchema = z.object({
    orgId: z.string().uuid(),
    email: z.string().email(),
    role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']),
});

// ─── Document Schemas ───────────────────────────────────────────────
export const createDocumentSchema = z.object({
    workspaceId: z.string().uuid(),
    title: z.string().min(1).max(500),
    content: z.any().optional(),
    parentId: z.string().uuid().optional().nullable(),
    icon: z.string().max(10).optional(),
});

export const updateDocumentSchema = z.object({
    id: z.string().uuid(),
    title: z.string().min(1).max(500).optional(),
    content: z.any().optional(),
    icon: z.string().max(10).optional(),
});

// ─── Role Types ─────────────────────────────────────────────────────
export type OrgRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type TaskPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
export type ProjectStatus = 'ACTIVE' | 'ARCHIVED' | 'DELETED';
export type Plan = 'FREE' | 'PRO' | 'TEAM';

// ─── Plan Limits ────────────────────────────────────────────────────
export const PLAN_LIMITS = {
    FREE: {
        maxMembers: 3,
        maxProjects: 3,
        maxStorageMB: 100,
        activityLogDays: 7,
        guestAccess: false,
        analytics: false,
        apiAccess: false,
    },
    PRO: {
        maxMembers: 10,
        maxProjects: Infinity,
        maxStorageMB: 5120,
        activityLogDays: 90,
        guestAccess: true,
        analytics: 'basic' as const,
        apiAccess: true,
    },
    TEAM: {
        maxMembers: Infinity,
        maxProjects: Infinity,
        maxStorageMB: 20480,
        activityLogDays: Infinity,
        guestAccess: true,
        analytics: 'advanced' as const,
        apiAccess: true,
    },
} as const;

export type PlanLimits = (typeof PLAN_LIMITS)[Plan];
