# FlowDesk: Production-Ready B2B SaaS Project Management Platform

**10/10 CV Specification · Full-Stack · 2026 Edition**
**Next.js 15 · tRPC · PostgreSQL · Socket.io · Stripe Subscriptions · GraphQL**

A multi-tenant B2B SaaS platform combining Linear-style project tracking with Notion-style rich-text docs. Demonstrates the full SaaS stack: multi-tenancy, real-time collaboration, subscription billing, RBAC, GraphQL/tRPC APIs, and team management — the exact skills that land full-stack roles at product companies.

---

## 1. Why FlowDesk Completes Your CV

| Skill Signal | TechVault (E-Commerce) | FlowDesk (B2B SaaS) |
| :--- | :--- | :--- |
| **Architecture** | Consumer B2C, monorepo | Multi-tenant SaaS, workspace isolation |
| **API Style** | REST + Express | tRPC (end-to-end typesafe) + GraphQL |
| **Real-time** | None | Socket.io live collaboration, presence |
| **Billing** | Stripe one-time payments | Stripe subscriptions, plan limits, webhooks |
| **Auth complexity** | JWT + OAuth, 3 roles | Workspace-scoped RBAC, invite system |
| **Database design** | 12 tables, e-commerce schema | 16 tables, multi-tenant, org isolation |
| **UI complexity** | Animations, product UI | Kanban DnD, rich text editor, dashboards |
| **Caching** | Redis product cache | Redis pub/sub for real-time + job queues |
| **Testing** | Jest + RTL + Supertest | Vitest + Playwright E2E + API tests |

Together, TechVault + FlowDesk cover every major full-stack pattern. A hiring manager sees: B2C + B2B, REST + tRPC, one-time + subscription billing, static content + real-time collaboration. That combination is extremely rare at junior level.

---

## 2. System Architecture

FlowDesk uses a Next.js full-stack monorepo with tRPC for type-safe API calls, Socket.io for real-time features, and a PostgreSQL database with row-level tenant isolation. This is the architecture pattern used by Linear, Vercel, and Planetscale internally.

| Layer | Technology | Why It Matters |
| :--- | :--- | :--- |
| **Frontend** | Next.js 15 + App Router | RSC, nested layouts, parallel routes for dashboard |
| **API Layer** | tRPC v11 | End-to-end type safety — zero API schema drift |
| **Real-time** | Socket.io + Redis Pub/Sub | Live cursors, task updates, presence indicators |
| **Database** | PostgreSQL + Drizzle ORM | Multi-tenant schema with org_id row isolation |
| **Cache / Queue** | Redis (Upstash) + BullMQ | Job queues for emails, notifications, exports |
| **Auth** | NextAuth v5 + custom RBAC | Workspace-scoped roles (Owner/Admin/Member/Viewer) |
| **Billing** | Stripe Subscriptions | Free/Pro/Team tiers, usage limits, portal |
| **Email** | Resend + React Email | Invites, notifications, billing receipts |
| **Rich Text** | Tiptap v2 | ProseMirror-based editor with collaborative editing |
| **Drag & Drop** | @dnd-kit | Kanban board with keyboard accessibility |
| **Charts** | Recharts + Tremor | Analytics dashboard, velocity charts |
| **File Storage** | Cloudinary / AWS S3 | Attachment uploads on tasks and docs |
| **Testing** | Vitest + Playwright | Unit + component + full E2E tests |
| **CI/CD** | GitHub Actions | Lint → test → build → deploy pipeline |
| **Monitoring** | Sentry + Axiom | Error tracking + structured log search |

---

## 3. Multi-Tenancy Design (Core SaaS Concept)

Multi-tenancy is the most important concept in B2B SaaS and the #1 thing that separates SaaS projects from regular apps on a CV. Every data access is scoped by `organization_id` — users can belong to multiple orgs, each with isolated data.

### Tenant Isolation Strategy
- Shared database, separate rows — `org_id` on every table.
- Every Drizzle query includes `WHERE org_id = ?` automatically via middleware.
- Users can belong to multiple organisations (many-to-many).
- Workspace URL slug: `flowdesk.app/[org-slug]/projects`
- Organisation switching without full re-auth.

### Organisation Hierarchy
- **Organisation** — top-level tenant (e.g. 'Acme Corp')
- **Workspace** — sub-division within org (e.g. 'Engineering')
- **Project** — belongs to workspace, has members
- **Team** — cross-project group with shared permissions

### RBAC (Role-Based Access Control)
- **Owner** — full control, billing, delete org
- **Admin** — manage members, projects, settings
- **Member** — create/edit tasks, comment, upload
- **Viewer** — read-only access (great for clients)
- Roles are per-workspace, not global — same user can be Admin in one, Viewer in another.

### Invitation System
- Email invite with signed token (24hr expiry).
- Invite by email even if user doesn't have account.
- Pending invites visible in workspace settings.
- Resend + React Email for branded invite emails.
- Auto-assign role on accept.

---

## 4. PostgreSQL Schema Design

16 tables with proper foreign keys, indexes, and tenant isolation. This schema demonstrates real relational thinking — not just MongoDB documents.

| Table | Key Columns | Notes |
| :--- | :--- | :--- |
| **users** | id, email, password_hash, avatar_url, created_at | Global — not org-scoped |
| **organizations** | id, name, slug, plan, stripe_customer_id, created_at | Top-level tenant |
| **org_members** | id, org_id, user_id, role, invited_by, joined_at | OWNER\|ADMIN\|MEMBER\|VIEWER |
| **invitations** | id, org_id, email, role, token, expires_at, accepted_at | Signed token, 24hr TTL |
| **workspaces** | id, org_id, name, slug, color, created_by | Sub-division of org |
| **projects** | id, workspace_id, org_id, name, slug, status, created_by | Indexed on org_id + status |
| **project_members** | id, project_id, user_id, role | Project-level override |
| **tasks** | id, project_id, org_id, title, description, status, priority, position, assignee_id, due_date | position for DnD ordering |
| **task_labels** | id, org_id, name, color | Org-scoped label library |
| **task_label_map** | task_id, label_id | Many-to-many |
| **comments** | id, task_id, user_id, content, created_at | Rich text via Tiptap JSON |
| **attachments** | id, task_id, user_id, url, public_id, filename, size | Cloudinary public_id |
| **activity_log** | id, org_id, task_id, user_id, action, metadata, created_at | Full audit trail |
| **documents** | id, workspace_id, org_id, title, content, created_by | Tiptap JSON content |
| **subscriptions** | id, org_id, stripe_sub_id, plan, status, current_period_end | Mirrors Stripe state |
| **notifications** | id, user_id, org_id, type, payload, read_at, created_at | In-app + email notifications |

---

## 5. tRPC API Design

tRPC provides end-to-end type safety between your Next.js frontend and backend — no API schema files, no code generation, no type drift.

| Router | Procedures | Description |
| :--- | :--- | :--- |
| **auth** | signIn, signUp, signOut, resetPassword, verifyEmail | Credential + OAuth flows |
| **org** | create, update, delete, getBySlug, switchOrg | Organisation management |
| **members** | list, invite, updateRole, remove, acceptInvite | Team management + invites |
| **workspace** | create, update, delete, list, getBySlug | Workspace CRUD |
| **project** | create, update, delete, list, getWithTasks, archive | Project management |
| **task** | create, update, delete, move, assign, bulkUpdate, listByProject | Core task operations |
| **task.labels** | create, delete, assign, remove, listByOrg | Label management |
| **comments** | create, update, delete, listByTask | Task comments |
| **attachments** | upload, delete, listByTask | File attachments |
| **activity** | listByTask, listByProject, listByOrg | Audit log queries |
| **documents** | create, update, delete, list, getBySlug | Rich text documents |
| **notifications** | list, markRead, markAllRead, getUnreadCount | In-app notifications |
| **billing** | getPlans, createCheckout, createPortal, getSubscription | Stripe billing portal |
| **analytics** | getVelocity, getTaskCompletion, getMemberActivity | Dashboard analytics |
| **search** | globalSearch | Cross-org full-text search |

### tRPC Usage Pattern (Frontend)
```typescript
// Type-safe API call — no fetch, no axios, no manual types needed
const { data: tasks } = api.task.listByProject.useQuery({ projectId });

// Mutation with optimistic update
const updateTask = api.task.update.useMutation({
  onMutate: async ({ id, status }) => {
    await utils.task.listByProject.cancel();
    const prev = utils.task.listByProject.getData({ projectId });
    utils.task.listByProject.setData({ projectId }, (old) => 
      old?.map(t => t.id === id ? { ...t, status } : t)
    );
    return { prev };
  },
  onError: (_, __, ctx) => {
    utils.task.listByProject.setData({ projectId }, ctx?.prev);
  },
  onSettled: () => utils.task.listByProject.invalidate(),
});
```

---

## 6. Real-Time Collaboration (Socket.io)

Real-time is what makes FlowDesk feel like a professional product. Socket.io rooms are scoped per workspace to ensure tenant isolation.

### Socket.io Architecture
- Server runs as a separate Node.js service on Railway.
- Redis Pub/Sub adapter for horizontal scaling across multiple servers.
- Rooms scoped per workspace: `socket.join(\`ws:\${workspaceId}\`)`.
- JWT verified on connection handshake (middleware).
- `org_id` validated — users cannot join rooms outside their org.

### Presence System
- Track which users are currently active in a project.
- Show avatar stack: 'Alex and 2 others are here'.
- Heartbeat every 30s, cleanup on disconnect.
- Redis SETEX for presence state (TTL 60s).

### Real-Time Events Emitted
- `task:created` — new task appears on all connected clients.
- `task:updated` — title, status, assignee changes broadcast.
- `task:moved` — Kanban column change syncs instantly.
- `task:deleted` — removed from board in real-time.
- `comment:added` — new comment appears without refresh.
- `user:presence` — who is currently viewing a project.
- `notification:new` — push notification badge update.

---

## 7. Stripe Subscription Billing

| Feature | Free | Pro ($12/mo) | Team ($29/mo) |
| :--- | :--- | :--- | :--- |
| **Members per org** | 3 | 10 | Unlimited |
| **Projects** | 3 | Unlimited | Unlimited |
| **File storage** | 100MB | 5GB | 20GB |
| **Activity log history** | 7 days | 90 days | Unlimited |
| **Guest/Viewer access** | No | Yes | Yes |
| **Analytics dashboard** | No | Basic | Advanced |
| **API access** | No | Yes | Yes |
| **Priority support** | No | Email | Chat + Email |
| **Custom branding** | No | No | Yes |

### Subscription Implementation
- Stripe Checkout Session for initial subscription.
- Customer Portal for self-serve subscription upgrades/downgrades/cancel.
- Webhook handler for all Stripe events (signature verified).
- Local subscriptions table mirrors Stripe state.
- Plan limits enforced server-side in tRPC middleware.
- Graceful degradation on plan downgrade (data preserved).

---

## 8. Complete Feature Specification

| Feature | Implementation Detail | CV Impact |
| :--- | :--- | :--- |
| **Kanban Board** | 4 columns (Todo/In Progress/Review/Done), @dnd-kit drag between columns, position field for ordering, keyboard accessible | VERY HIGH |
| **List View** | Sortable table view of tasks with inline editing, bulk select, bulk status update | HIGH |
| **Calendar View** | Monthly calendar with tasks by due date, drag to reschedule, react-big-calendar or custom | HIGH |
| **Rich Text Tasks** | Tiptap editor in task description: headings, code blocks, @mentions, checklists, images | HIGH |
| **Task Detail Modal** | Slide-over panel: assignee, labels, due date, attachments, comments, activity log | HIGH |
| **Real-time Updates** | Socket.io — all clients see task changes instantly, presence avatars on project header | VERY HIGH |
| **Team Invitations** | Email invite with role assignment, pending invites management, re-invite, revoke | HIGH |
| **RBAC Enforcement** | Server-side middleware on every tRPC procedure, UI adapts to user role | VERY HIGH |
| **Subscription Billing** | Stripe checkout + customer portal, plan limit enforcement, upgrade prompts in UI | VERY HIGH |
| **Documents** | Notion-style pages per workspace, Tiptap rich editor, nested pages, sidebar navigation | HIGH |
| **Global Search** | Full-text search across tasks + docs + comments (PostgreSQL tsvector), Cmd+K palette | HIGH |
| **Analytics Dashboard** | Team velocity chart (tasks/week), completion rate by project, member activity heatmap | HIGH |
| **Activity Feed** | Complete audit log: who did what when — filterable by user/project/action type | MEDIUM |
| **Notifications** | In-app bell with unread count (Socket.io), email digest (BullMQ daily job), mark read | MEDIUM |
| **File Attachments** | Upload to Cloudinary from task detail, preview images inline, download/delete | MEDIUM |
| **Dark / Light Mode** | next-themes, per-user preference, smooth CSS variable transition | MEDIUM |
| **Onboarding Flow** | First-time setup: create org → invite team → create project → add tasks | HIGH |
| **Mobile Responsive** | Full mobile layout, bottom sheet modals, touch-friendly Kanban drag | MEDIUM |

---

## 9. Folder Structure

```text
flowdesk/ # Turborepo monorepo
├── apps/
│   └── web/ # Next.js 15 Application
│       ├── app/
│       │   ├── (auth)/ # login, register, forgot-password
│       │   ├── (marketing)/ # landing, pricing, docs (static)
│       │   ├── [orgSlug]/ # Tenant-scoped workspace
│       │   │   ├── layout.tsx # Org context + socket provider
│       │   │   ├── [wsSlug]/ # Workspace layout + sidebar
│       │   │   │   ├── projects/
│       │   │   │   │   └── [slug]/ # Kanban / List / Calendar views
│       │   │   │   ├── docs/ # Document pages (Tiptap)
│       │   │   │   └── settings/ # Workspace settings
│       │   │   ├── settings/ # Org settings, billing, members
│       │   │   └── analytics/ # Org-level analytics dashboard
│       │   ├── api/
│       │   │   ├── trpc/[trpc]/ # tRPC handler
│       │   │   ├── auth/[...nextauth] # NextAuth handler
│       │   │   └── webhooks/stripe/ # Stripe webhook handler
│       ├── components/
│       │   ├── board/ # KanbanBoard, TaskCard, Column
│       │   ├── task/ # TaskDetail, TaskForm, Comments
│       │   ├── editor/ # TiptapEditor, extensions
│       │   ├── billing/ # PricingTable, UpgradeModal
│       │   ├── realtime/ # PresenceAvatars, LiveIndicator
│       │   └── ui/ # shadcn/ui components
│       ├── lib/
│       │   ├── trpc/ # tRPC client setup
│       │   ├── socket/ # useSocket hook, events
│       │   ├── stores/ # Zustand: board.store, ui.store
│       │   └── hooks/ # useOrg, useProject, usePermission
│       └── __tests__/ # Vitest + Playwright tests
├── socket-server/ # Standalone Socket.io server
│   ├── src/
│   │   ├── handlers/ # task, comment, presence events
│   │   ├── middleware/ # JWT auth, org validation
│   │   └── redis/ # Pub/Sub adapter setup
├── packages/
│   ├── db/ # Drizzle schema + migrations
│   ├── trpc/ # Shared tRPC routers + context
│   ├── types/ # Shared TypeScript interfaces
│   └── config/ # ESLint, tsconfig, Prettier base
├── .github/workflows/ # CI: lint → test → build → deploy
├── turbo.json
└── README.md
```

---

## 10. UI / UX Implementation Details

### Kanban Board (Core UI)
- `@dnd-kit/sortable` — columns and cards both draggable.
- Drag overlay shows ghost card while dragging.
- Optimistic update: card moves instantly, DB syncs after.
- Keyboard accessible (Tab + Space + Arrow keys).
- Column collapse with smooth height animation.
- Task count badge per column.

### Tiptap Rich Text Editor
- Extensions: Bold, Italic, Code, CodeBlock, BulletList.
- `@mention` extension for tagging team members.
- `/slash` commands for quick formatting.
- Image upload directly into editor (Cloudinary).
- Auto-save with debounce (1.5s after last keystroke).
- Markdown shortcuts (## for H2, ** for bold).

### Animations (Framer Motion)
- Page transitions between views (fade + slide).
- Task card hover: subtle lift + border glow.
- Sidebar collapse: spring-based width animation.
- Modal/sheet: enter from right with spring.
- Notification bell: spring bounce on new notification.
- Staggered list rendering for task lists.

### Dashboard & Analytics
- Recharts for velocity line chart (tasks completed per week).
- Tremor for stat cards (total tasks, completion rate, overdue).
- Member activity heatmap (GitHub-style contribution graph).
- Filter by date range, project, member.
