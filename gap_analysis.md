# FlowDesk: Spec vs Implementation Gap Analysis

## Summary

The project has a **solid foundation** — multi-tenant schema, tRPC, org/workspace routing, Kanban board, task management, billing, and a Socket.io server are in place. However, **many spec'd features are either missing entirely or only partially implemented**. Below is a detailed breakdown.

---

## ✅ What's Been Implemented

| Area | Status | Details |
|:---|:---|:---|
| **Monorepo** | ✅ Done | Turborepo with `apps/web`, `apps/ws`, `packages/db`, `packages/trpc`, `packages/types` |
| **DB Schema** | ✅ Done | 16+ tables — users, accounts, sessions, organizations, org_members, invitations, workspaces, projects, project_members, tasks, task_labels, task_label_map, comments, attachments, activity_log, documents, subscriptions, notifications |
| **tRPC API** | ✅ Mostly Done | Routers: org, members, workspace, project, task (CRUD + move + bulkUpdate), comment, document, notification, billing, activity |
| **Auth** | ⚠️ Deviated | Firebase Auth used instead of spec'd NextAuth v5 (next-auth is in dependencies but Firebase is the actual implementation) |
| **Org Management** | ✅ Done | Create, getBySlug, delete, list, org switching |
| **Members & Invites** | ✅ Done | List, invite, updateRole, remove, acceptInvite |
| **Workspaces** | ✅ Done | Create, update, delete, list, getBySlug |
| **Projects** | ✅ Done | Create, list, getWithTasks, delete |
| **Tasks** | ✅ Done | Create, update, delete, move, bulkUpdate, listByProject with assignee notifications |
| **Kanban Board** | ✅ Done | `@dnd-kit` based board with columns, cards, drag-and-drop |
| **Task Detail** | ✅ Done | `task-detail-panel.tsx`, `task-modal.tsx`, `comment-section.tsx` |
| **Comments** | ✅ Done | CRUD with tRPC router |
| **Documents** | ✅ Done | Tiptap-based docs page, CRUD router, `editor.tsx` component |
| **Notifications** | ✅ Done | tRPC router (list, markRead, markAllRead), `notification-popover.tsx` in layout |
| **Billing** | ✅ Done | Stripe billing router, Stripe webhook endpoint, billing settings page |
| **Activity Log** | ✅ Partial | DB schema + basic tRPC list query, activity page exists |
| **Layout/Nav** | ✅ Done | Sidebar, org-switcher, workspace-switcher, user-nav, settings sidebar |
| **Socket.io Server** | ⚠️ Minimal | Basic room join (user/org rooms), broadcast endpoint. No auth, no presence |
| **Dark/Light Mode** | ✅ Done | theme-provider with next-themes |
| **Landing Page** | ✅ Done | `app/page.tsx` (20KB) serves as landing |
| **Dashboard Stats** | ✅ Partial | `dashboard-stats.tsx` + `recent-activity.tsx` exist |
| **Recharts** | ✅ Installed | In `package.json` dependencies |

---

## ❌ Missing Features (Spec → Not Implemented)

### 🔴 Critical Gaps (High CV Impact)

| Feature | Spec Requirement | Current State |
|:---|:---|:---|
| **Analytics Dashboard** | Velocity chart, completion rate, member activity heatmap, date filtering | ❌ No `/analytics` route. No analytics tRPC router. Dashboard stats are basic counts only |
| **Calendar View** | Monthly calendar with tasks by due date, drag to reschedule | ❌ Completely missing — no calendar view page or component |
| **List View** | Sortable table view with inline editing and bulk operations | ❌ Backlog page exists but may not match spec's sortable table + inline editing |
| **Global Search** | Full-text search via PostgreSQL tsvector, Cmd+K palette | ❌ No search router, no search UI, no tsvector setup |
| **RBAC Enforcement** | Server-side middleware on **every** tRPC procedure | ⚠️ Partial — `createOrgProcedure()` exists with role checks but not applied consistently across all routers |
| **Onboarding Flow** | Create org → invite team → create project → add tasks wizard | ❌ Completely missing |

### 🟠 Moderate Gaps

| Feature | Spec Requirement | Current State |
|:---|:---|:---|
| **Presence System** | Avatar stack, heartbeat, Redis SETEX | ❌ Socket.io server has no presence logic at all |
| **Real-time Events** | task:created/updated/moved/deleted, comment:added, notification:new | ⚠️ Backend calls `broadcast()` for some events but Socket.io server is a bare MVP with no Redis pub/sub |
| **Tiptap Rich Text** | @mention, /slash commands, image upload, auto-save with debounce | ⚠️ Editor component exists; unclear if mention/slash/image/auto-save extensions are configured |
| **Attachments Router** | upload, delete, listByTask | ❌ Schema exists but no tRPC router for attachments |
| **Labels Router** | create, delete, assign, remove, listByOrg | ❌ Schema exists but no dedicated tRPC router for label management |
| **Email Integration** | Resend + React Email for invites, notifications, receipts | ❌ Not installed, TODO comments in invite code |
| **Plan Limits Enforcement** | Server-side middleware enforcing member/project/storage limits | ❌ No plan-limit middleware |
| **Kanban Keyboard A11y** | Tab + Space + Arrow key navigation | ⚠️ Unclear if DnD keyboard support is configured |
| **Column Collapse** | Smooth height animation on column collapse | ⚠️ Not evident |
| **Auth** | NextAuth v5 + custom RBAC | ⚠️ Firebase Auth used instead (deviation from spec) |

### 🟡 Lower Priority Gaps

| Feature | Spec Requirement | Current State |
|:---|:---|:---|
| **Framer Motion Animations** | Page transitions, card hover effects, sidebar collapse spring animation, modal spring, notification bounce, staggered lists | ❌ framer-motion not installed |
| **Tremor** | Stat cards for analytics | ❌ Not installed |
| **BullMQ** | Job queues for emails, notifications, exports | ❌ Not installed |
| **Cloudinary / S3** | File uploads for attachments | ❌ Not installed |
| **Activity Audit Trail** | Full filterable audit log (by user/project/action) | ⚠️ Schema + basic list exists but no filtering |
| **Email Digest** | BullMQ daily job for notification digest | ❌ No job queue |
| **Mobile Responsive** | Full mobile layout, bottom sheets, touch-friendly Kanban | ⚠️ Not verified |
| **Forgot Password** | Password reset flow | ❌ No forgot-password page (only login + register) |
| **Verify Email** | Email verification flow | ❌ No verify-email page/logic |

---

## 🏗️ Infrastructure Gaps

| Area | Spec | Current |
|:---|:---|:---|
| **Testing** | Vitest + Playwright E2E + API tests | ❌ No Vitest/Playwright installed, no test files |
| **CI/CD** | GitHub Actions (lint → test → build → deploy) | ❌ No `.github/workflows/` directory |
| **Monitoring** | Sentry + Axiom | ❌ Not installed |
| **`packages/config`** | Shared ESLint, tsconfig, Prettier configs | ❌ Only a root `.prettierrc` — no `packages/config` |
| **Redis Pub/Sub** | Socket.io horizontal scaling adapter | ❌ No Redis adapter in WS server |
| **JWT Auth on WS** | JWT verified on connection handshake | ❌ No auth middleware on socket connections |
| **GraphQL** | Spec title mentions GraphQL | ❌ Not implemented anywhere |

---

## 📁 Route Structure Gaps

### Spec'd Route Structure vs Actual

| Spec Route | Status | Notes |
|:---|:---|:---|
| `(auth)/login` | ✅ | Exists |
| `(auth)/register` | ✅ | Exists |
| `(auth)/forgot-password` | ❌ | Missing |
| `(marketing)/landing, pricing, docs` | ⚠️ | Landing exists at root `page.tsx`; no `(marketing)` group, no pricing page, no docs page |
| `[orgSlug]/layout.tsx` | ✅ | Exists |
| `[orgSlug]/settings/` | ✅ | Exists with billing |
| `[orgSlug]/analytics/` | ❌ | Missing |
| `[orgSlug]/[wsSlug]/projects/[slug]/` | ❌ | Board is at `[wsSlug]/board`, not under `projects/[slug]/` as spec'd |
| `[orgSlug]/[wsSlug]/docs/` | ✅ | Exists |
| `[orgSlug]/[wsSlug]/settings/` | ❌ | No workspace-level settings |
| `api/trpc/[trpc]/` | ✅ | Exists |
| `api/auth/[...nextauth]` | ⚠️ | Firebase auth endpoint exists instead |
| `api/webhooks/stripe/` | ✅ | Exists |

---

## 🎯 Priority Implementation Order (Recommended)

1. **Analytics Dashboard** — Extremely high CV impact. Add analytics tRPC router + `/[orgSlug]/analytics` page with Recharts (already installed)
2. **Global Search** — High impact. Add search router + Cmd+K palette UI
3. **Calendar View** — High impact. Add calendar view to project pages
4. **List View** — High impact. Enhance backlog or add sortable table view
5. **Onboarding Flow** — High impact. First-time wizard
6. **Attachments & Labels tRPC Routers** — Medium. Schemas exist, just need routers
7. **Framer Motion Animations** — Medium. Install + add page transitions, card hover effects
8. **Socket.io Hardening** — Presence system, JWT auth, Redis pub/sub
9. **Email (Resend)** — Invite emails, notifications
10. **Plan Limits Enforcement** — Stripe plan limits in tRPC middleware
11. **Testing** — Vitest + Playwright setup
12. **CI/CD** — GitHub Actions pipeline
13. **Monitoring** — Sentry integration
