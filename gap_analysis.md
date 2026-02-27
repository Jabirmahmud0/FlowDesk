# FlowDesk: Spec vs Implementation Gap Analysis (Updated Feb 2026)

> **Note:** This doc was previously outdated. Fully re-verified against actual source files.

---

## ✅ What's Implemented

### Infrastructure
| Area | Status | Details |
|:---|:---|:---|
| **Monorepo** | ✅ | Turborepo — `apps/web`, `apps/ws`, `packages/db`, `packages/trpc`, `packages/types` |
| **CI/CD** | ✅ | GitHub Actions `ci.yml` — single job: lint → typecheck → build |
| **Sentry** | ✅ | `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` |
| **Vitest** | ✅ | `vitest.config.ts` in `apps/web`, tests in `packages/trpc/src/lib/plan-limits.test.ts` |

### Database (16+ tables)
| Status | Details |
|:---|:---|
| ✅ | `users`, `accounts`, `sessions`, `organizations`, `org_members`, `invitations` |
| ✅ | `workspaces`, `projects`, `project_members`, `tasks`, `task_labels`, `task_label_map` |
| ✅ | `comments`, `attachments`, `activity_log`, `documents`, `document_versions`, `document_comments` |
| ✅ | `subscriptions`, `notifications`, `user_settings` |

### tRPC API (all routers fully implemented)
| Router | Status |
|:---|:---|
| `org` | ✅ create, getBySlug, update, delete, list |
| `members` | ✅ list, invite, updateRole, remove, acceptInvite, listInvitations, resendInvite, cancelInvite |
| `workspace` | ✅ create, list, getBySlug, update, delete |
| `project` | ✅ create, list, getWithTasks, update, delete |
| `task` | ✅ create, listByProject, myTasks, update, move, bulkUpdate, delete |
| `comment` | ✅ listByTask, create, update, delete |
| `document` | ✅ get, list, create, update, delete + version history + document comments |
| `notification` | ✅ list, getUnreadCount, markRead, markAllRead, delete |
| `activity` | ✅ list (with filters: userId, action, projectId, taskId, documentId), getByTask, getByProject, getByDocument |
| `label` | ✅ listByOrg, create, delete, assign (to task), remove (from task) |
| `attachment` | ✅ listByTask, create, delete |
| `analytics` | ✅ getDashboardStats, getVelocity, getTaskCompletion, getMemberActivity |
| `search` | ✅ global (tasks + documents + comments via ILIKE) |
| `billing` | ✅ Stripe checkout, portal, subscription management |
| `user` | ✅ getProfile, updateProfile, getNotificationSettings, updateNotificationSettings |

### Frontend Features
| Feature | Status | Notes |
|:---|:---|:---|
| **Auth pages** | ✅ | login, register, forgot-password, verify-email |
| **Landing page** | ✅ | `(marketing)/page.tsx` with full hero/features/CTA |
| **Pricing page** | ✅ | `(marketing)/pricing/` |
| **Org layout + routing** | ✅ | `[orgSlug]/layout.tsx` with Sidebar + CommandPalette + NotificationPopover |
| **Kanban Board** | ✅ | `@dnd-kit` with drag-and-drop, column headers, task cards |
| **Backlog / List View** | ✅ | Sortable table with inline editing (title, status, priority) + filter/search |
| **Calendar View** | ✅ | Custom monthly calendar grid, tasks by due date, click to open task detail |
| **Task Detail Panel** | ✅ | Slide-over with assignee, labels, due date, comments, activity log |
| **Task Comments** | ✅ | Create, update, delete with user avatars |
| **Documents** | ✅ | Tiptap editor, create/update/delete, version history |
| **Analytics Dashboard** | ✅ | `/[orgSlug]/analytics` — velocity chart, task distribution pie, member activity bar (Recharts) |
| **Activity Feed** | ✅ | `/[wsSlug]/activity` with full audit log + filtering |
| **Notifications** | ✅ | Bell popover, unread count badge, mark read/all read |
| **Global Search** | ✅ | `CommandPalette` — Cmd+K / Ctrl+K shortcut, tasks/docs/comments results, keyboard nav |
| **Members page** | ✅ | List, invite, update role, remove, pending invitations |
| **Settings** | ✅ | Org settings, billing settings, workspace settings |
| **Billing** | ✅ | Stripe subscription, plan display, upgrade/portal links |
| **Onboarding** | ✅ | `/app/onboarding/page.tsx` — first-time wizard |
| **Dark / Light Mode** | ✅ | `next-themes` provider |
| **Framer Motion** | ✅ | Sidebar collapse spring animation, page transitions (`page-transition.tsx`), layout animations |
| **Sentry** | ✅ | Error monitoring wired in client + server + edge |

### Socket.io Server (`apps/ws`)
| Feature | Status | Notes |
|:---|:---|:---|
| **Firebase JWT auth middleware** | ✅ | Verifies Firebase ID tokens on handshake |
| **Presence tracking** | ✅ | In-memory `onlineUsers` map, `PRESENCE_UPDATE` events on connect/disconnect |
| **Room management** | ✅ | `user:${userId}`, `org:${orgId}`, `ws:${wsId}` rooms |
| **Typing indicators** | ✅ | `typing:start` / `typing:stop` events per task |
| **Heartbeat** | ✅ | `heartbeat` / `heartbeat:ack` |
| **Broadcast endpoint** | ✅ | `POST /broadcast` used by tRPC to push real-time events |
| **Presence API** | ✅ | `GET /presence/:orgId` |

### Backend Utilities
| Utility | Status |
|:---|:---|
| `plan-limits.ts` | ✅ `checkMemberLimit`, `checkProjectLimit` — enforced in `members.invite` and `project.create` |
| `email.ts` (Resend) | ✅ `sendInviteEmail` — called from `members.invite` and `members.resendInvite` |
| Activity logging helper | ✅ `logActivity()` called on every significant mutation |
| Notification helper | ✅ `createNotification()` + socket broadcast |

---

## ⚠️ Known Limitations / Partial Implementations

| Area | Detail |
|:---|:---|
| **Auth** | Firebase Auth used instead of spec'd NextAuth v5. NextAuth is in `package.json` but Firebase is the active implementation. |
| **Redis Pub/Sub** | Socket.io server uses in-memory presence (not Redis SETEX). Fine for single server; needs Redis adapter for horizontal scaling. |
| **File Uploads** | Attachment tRPC router saves URL/metadata. No Cloudinary SDK integration — uploads must be done client-side (via Cloudinary upload widget or presigned URLs). |
| **Playwright E2E** | Vitest set up, but no Playwright installed and no E2E test files yet. |
| **`packages/config`** | No shared ESLint/Prettier config package — configs live in root `.prettierrc` and `apps/web/.eslintrc.json`. |
| **Route structure** | Project board lives at `[wsSlug]/board` not `[wsSlug]/projects/[slug]` as spec'd. Functionally equivalent. |
| **BullMQ** | No job queue — email digest and scheduled notifications not implemented. |
| **Mobile** | Not fully verified on mobile — bottom sheet modals and touch-friendly Kanban not confirmed. |
| **GraphQL** | Spec title mentions GraphQL, but tRPC is used throughout (this is better for type safety). |

---

## 🎯 Remaining Work (Lower Priority)

| Priority | Feature | Effort |
|:---|:---|:---|
| Medium | Redis adapter for Socket.io (horizontal scaling) | ~2h |
| Medium | Playwright E2E test suite | ~4h |
| Low | Cloudinary upload widget integration (client-side upload) | ~2h |
| Low | BullMQ email digest job | ~3h |
| Low | `packages/config` shared ESLint/tsconfig | ~1h |
| Low | Mobile layout testing + bottom sheet modals | ~3h |
