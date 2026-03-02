# 🌊 FlowDesk

**The Ultimate Production-Ready B2B SaaS Project Management Platform**

FlowDesk is a high-performance, multi-tenant SaaS platform designed for modern teams. It seamlessly integrates Linear-style project tracking with Notion-inspired collaborative documentation, all powered by a robust real-time engine.

[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![tRPC](https://img.shields.io/badge/tRPC-v11-2596be?style=for-the-badge&logo=trpc)](https://trpc.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-06B6D4?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

---

## ✨ Key Features

### 🏢 Multi-tenant Architecture
- **Organization Isolation**: Complete data separation between organizations.
- **Hierarchical Workspaces**: Group projects and docs within workspaces.
- **RBAC (Role-Based Access Control)**: Owner, Admin, Member, and Viewer roles.
- **Custom Slugs**: SEO-friendly and branded URLs for organizations and workspaces.

### 📋 Project & Task Management
- **Kanban Boards**: Drag-and-drop task management with `@dnd-kit`.
- **Linear-style UX**: High-speed task creation, status tracking, and priority management.
- **Rich Task Metadata**: Labels, assignees, due dates, and full-text search with PostgreSQL TSVector.
- **Smart Filters**: Filter by status, priority, or assignee.

### 📝 Collaborative Documentation
- **Tiptap Editor**: A powerful, extensible rich-text editor.
- **Notion-style Experience**: Support for slash commands, tables, code blocks, and more.
- **Real-time Sync**: Collaborative editing powered by Socket.io and Redis.

### 💳 Enterprise SaaS Ready
- **Subscription Engine**: Full Stripe integration with Free, Pro, and Team plans.
- **Usage Limits**: Plan-based restrictions on members, projects, and storage.
- **Analytics Dashboard**: Beautiful metrics and charts using Tremor and Recharts.
- **API Keys**: Secure API access for third-party integrations.

### 🔐 Advanced Security & Auth
- **NextAuth v5**: Secure authentication via OAuth (Google, GitHub) or Email/Password.
- **Session Management**: Persistent sessions with database backing.
- **Invite System**: Secure token-based email invitations.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Components)
- **UI Components**: [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/)
- **Styling**: [Tailwind CSS 4.0](https://tailwindcss.com/)
- **Charts**: [Tremor](https://www.tremor.so/), [Recharts](https://recharts.org/)
- **State Management**: [tRPC](https://trpc.io/), [TanStack Query](https://tanstack.com/query/latest), [Zustand](https://github.com/pmndrs/zustand)

### Backend
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **API**: [tRPC](https://trpc.io/) & [GraphQL (Apollo)](https://www.apollographql.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Real-time**: [Socket.io](https://socket.io/), [Redis](https://redis.io/)
- **Background Jobs**: [BullMQ](https://docs.bullmq.io/)

### Infrastructure & Tools
- **Monorepo**: [Turborepo](https://turbo.build/)
- **Email**: [Resend](https://resend.com/) & [React Email](https://react.email/)
- **Monitoring**: [Sentry](https://sentry.io/)
- **Testing**: [Vitest](https://vitest.dev/), [Playwright](https://playwright.dev/)
- **Containerization**: [Docker](https://www.docker.com/)

---

## 📂 Project Structure

FlowDesk is built as a highly modular monorepo:

```bash
flowdesk/
├── apps/
│   ├── web/          # Next.js 15 application (Frontend + API Routes)
│   └── ws/           # Dedicated WebSocket server (Node.js + Socket.io)
├── packages/
│   ├── db/           # Drizzle schema, migrations, and database client
│   ├── trpc/         # Shared tRPC routers and server-side logic
│   ├── graphql/      # GraphQL schema, resolvers, and Apollo setup
│   ├── types/        # Shared TypeScript interfaces and Zod schemas
│   └── config/       # Shared ESLint, Prettier, and TSConfig
├── docker-compose.yml # Dev infrastructure (Postgres, Redis)
└── turbo.json        # Build pipeline configuration
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v20 or higher
- **Docker**: For running PostgreSQL and Redis locally
- **Stripe CLI**: Optional, for testing webhooks

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/flowdesk.git
   cd flowdesk
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Copy `.env.example` to `.env` and `.env.local.example` to `apps/web/.env.local`. Fill in the required secrets.
   ```bash
   cp .env.example .env
   cp apps/web/.env.local.example apps/web/.env.local
   ```

4. **Spin up Infrastructure**:
   ```bash
   docker-compose up -d
   ```

5. **Database Setup**:
   ```bash
   npm run db:generate
   npm run db:push
   ```

6. **Start Development Server**:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to see the application in action.

---

## 🧪 Testing

FlowDesk maintains high code quality through rigorous testing:

- **Unit/Integration**: `npm run test` (Vitest)
- **End-to-End**: `npm run test:e2e` (Playwright)
- **Type Checking**: `npm run type-check` (TypeScript)
- **Linting**: `npm run lint` (ESLint)

---

## 🚢 Deployment

FlowDesk is container-ready and can be deployed via Docker Compose or to platforms like Vercel (for the web app) and railway/render (for the WS server).

```bash
# Production Build
npm run build

# Docker Production Start
docker-compose -f docker-compose.yml up --build
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 🤝 Support

For support, please open an issue or contact our engineering team at `support@flowdesk.com`.

---

Built with ❤️ by the FlowDesk Team.
