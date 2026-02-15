import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, users, organizations, workspaces, projects, tasks, orgMembers, projectMembers, taskStatusEnum, taskPriorityEnum, orgRoleEnum, planEnum } from './src';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function seed() {
    console.log('🌱 Starting database seed...');

    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is not defined');
    }

    try {
        // 1. Create Test User
        const email = 'admin@flowdesk.app';
        let user = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (!user) {
            console.log('Creating test user...');
            const hashedPassword = await bcrypt.hash('password123', 10);
            const [newUser] = await db.insert(users).values({
                name: 'Admin User',
                email,
                passwordHash: hashedPassword,
                emailVerified: new Date(),
                image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
            }).returning();
            user = newUser;
            console.log('✅ Created user:', user.email);
        } else {
            console.log('ℹ️ User already exists:', user.email);
        }

        // 2. Create Organization
        const orgSlug = 'flowdesk-corp';
        let org = await db.query.organizations.findFirst({
            where: eq(organizations.slug, orgSlug),
        });

        if (!org) {
            console.log('Creating test organization...');
            const [newOrg] = await db.insert(organizations).values({
                name: 'FlowDesk Corp',
                slug: orgSlug,
                createdBy: user.id,
                plan: 'PRO',
            }).returning();
            org = newOrg;

            // Add user as owner
            await db.insert(orgMembers).values({
                orgId: org.id,
                userId: user.id,
                role: 'OWNER',
            });
            console.log('✅ Created organization:', org.name);
        } else {
            console.log('ℹ️ Organization already exists:', org.name);
        }

        // 3. Create Workspace
        const wsSlug = 'engineering';
        let workspace = await db.query.workspaces.findFirst({
            where: (workspaces, { and, eq }) => and(
                eq(workspaces.slug, wsSlug),
                eq(workspaces.orgId, org!.id) // Non-null assertion safe because we ensured org exists
            )
        });

        if (!workspace) {
            console.log('Creating test workspace...');
            const [newWs] = await db.insert(workspaces).values({
                name: 'Engineering',
                slug: wsSlug,
                orgId: org.id,
                createdBy: user.id,
                color: '#6366f1',
            }).returning();
            workspace = newWs;
            console.log('✅ Created workspace:', workspace.name);
        } else {
            console.log('ℹ️ Workspace already exists:', workspace.name);
        }

        // 4. Create Project
        const projSlug = 'platform-launch';
        let project = await db.query.projects.findFirst({
            where: (projects, { and, eq }) => and(
                eq(projects.slug, projSlug),
                eq(projects.workspaceId, workspace!.id)
            )
        });

        if (!project) {
            console.log('Creating test project...');
            const [newProj] = await db.insert(projects).values({
                name: 'Platform Launch',
                slug: projSlug,
                workspaceId: workspace.id,
                orgId: org.id,
                createdBy: user.id,
                description: 'Launch the new platform version',
                status: 'ACTIVE',
            }).returning();
            project = newProj;

            // Add user to project
            await db.insert(projectMembers).values({
                projectId: project.id,
                userId: user.id,
                role: 'OWNER', // Re-using orgRoleEnum, assuming it fits or project has similar roles
            });

            console.log('✅ Created project:', project.name);
        } else {
            console.log('ℹ️ Project already exists:', project.name);
        }

        // 5. Create Sample Tasks
        const tasksCount = await db.$count(tasks, eq(tasks.projectId, project.id));
        if (tasksCount === 0) {
            console.log('Creating sample tasks...');
            await db.insert(tasks).values([
                {
                    title: 'Design System Implementation',
                    description: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Implement typography and color palette.' }] }] },
                    status: 'IN_PROGRESS',
                    priority: 'HIGH',
                    projectId: project.id,
                    orgId: org.id,
                    createdBy: user.id,
                    assigneeId: user.id,
                    position: 1000,
                },
                {
                    title: 'Database Schema Migration',
                    description: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Run initial migrations.' }] }] },
                    status: 'DONE',
                    priority: 'URGENT',
                    projectId: project.id,
                    orgId: org.id,
                    createdBy: user.id,
                    assigneeId: user.id,
                    position: 2000,
                },
                {
                    title: 'User Authentication Flow',
                    description: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Setup NextAuth V5.' }] }] },
                    status: 'TODO',
                    priority: 'MEDIUM',
                    projectId: project.id,
                    orgId: org.id,
                    createdBy: user.id,
                    position: 3000,
                }
            ]);
            console.log('✅ Created sample tasks');
        } else {
            console.log('ℹ️ Tasks already exist');
        }

        console.log('🌱 Seeding completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seed();
