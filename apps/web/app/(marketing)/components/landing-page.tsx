import Link from 'next/link';
import {
    ArrowRight,
    Kanban,
    Users,
    Shield,
    Zap,
    FileText,
    CreditCard,
    CheckCircle,
    BarChart3,
    Star,
    Globe,
    Github,
} from 'lucide-react';

const FEATURES = [
    {
        icon: Kanban,
        title: 'Visual Kanban Boards',
        desc: 'Drag-and-drop task management with real-time updates across all connected team members.',
        color: 'from-blue-500/20 to-blue-600/10 border-blue-500/20',
        iconColor: 'text-blue-500',
    },
    {
        icon: Users,
        title: 'Multi-Tenant Workspaces',
        desc: 'Org-scoped data isolation. Belong to multiple orgs with fine-grained role-based access.',
        color: 'from-violet-500/20 to-violet-600/10 border-violet-500/20',
        iconColor: 'text-violet-500',
    },
    {
        icon: Shield,
        title: 'Granular RBAC',
        desc: 'Owner → Admin → Member → Viewer roles, enforced server-side on every API call.',
        color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20',
        iconColor: 'text-emerald-500',
    },
    {
        icon: Zap,
        title: 'Real-Time Collaboration',
        desc: 'Socket.io live updates, presence tracking, typing indicators, and instant task sync.',
        color: 'from-amber-500/20 to-amber-600/10 border-amber-500/20',
        iconColor: 'text-amber-500',
    },
    {
        icon: FileText,
        title: 'Rich Text Documents',
        desc: 'Tiptap-powered docs with @mentions, slash commands, version history, and auto-save.',
        color: 'from-orange-500/20 to-orange-600/10 border-orange-500/20',
        iconColor: 'text-orange-500',
    },
    {
        icon: CreditCard,
        title: 'Stripe Billing',
        desc: 'Usage-limited plans, Stripe Checkout & Customer Portal, webhooks, and plan enforcement.',
        color: 'from-pink-500/20 to-pink-600/10 border-pink-500/20',
        iconColor: 'text-pink-500',
    },
    {
        icon: BarChart3,
        title: 'Advanced Analytics',
        desc: 'Velocity charts, task burn-downs, member activity heatmaps, and completion rates.',
        color: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/20',
        iconColor: 'text-cyan-500',
    },
    {
        icon: Globe,
        title: 'Global Search',
        desc: 'Cmd+K palette to search across all tasks, documents, and comments in milliseconds.',
        color: 'from-teal-500/20 to-teal-600/10 border-teal-500/20',
        iconColor: 'text-teal-500',
    },
];

const PLANS = [
    {
        name: 'Free',
        price: '$0',
        period: '',
        desc: 'For small teams getting started',
        features: ['Up to 3 members', '3 projects', '100MB storage', 'Kanban & list views', 'Basic notifications'],
        cta: 'Get Started Free',
        href: '/register',
        popular: false,
        badge: null,
    },
    {
        name: 'Pro',
        price: '$12',
        period: '/mo',
        desc: 'For growing teams that need more',
        features: ['Up to 10 members', 'Unlimited projects', '5GB storage', 'Full analytics', 'Priority support', 'Guest access'],
        cta: 'Start Pro Trial',
        href: '/register',
        popular: true,
        badge: 'Most Popular',
    },
    {
        name: 'Team',
        price: '$29',
        period: '/mo',
        desc: 'For organizations at scale',
        features: ['Unlimited members', 'Unlimited projects', '20GB storage', 'Advanced analytics', 'Custom branding', 'SLA guarantee'],
        cta: 'Contact Sales',
        href: '/register',
        popular: false,
        badge: null,
    },
];

const TESTIMONIALS = [
    { name: 'Aisha Chen', role: 'CTO @ Nexus Labs', avatar: 'AC', text: 'FlowDesk replaced five tools for us. Kanban, docs, and billing in one place — finally!' },
    { name: 'Marcus Webb', role: 'Lead at BuildFast', avatar: 'MW', text: 'The real-time collaboration is buttery smooth. Our remote team loves the presence indicators.' },
    { name: 'Sophie Laurent', role: 'PM @ Orbit', avatar: 'SL', text: 'Global search and activity log alone saved us hours of back-and-forth every week.' },
];

export default function LandingPage() {
    return (
        <div className="overflow-hidden">
            {/* ─── Hero ─────────────────────────────────────────── */}
            <section className="relative min-h-screen flex items-center justify-center pt-24 pb-16 px-4">
                {/* Radial gradient background */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.15),transparent)]" />
                {/* Grid pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.04)_1px,transparent_1px)] bg-[size:72px_72px]" />

                <div className="relative w-full max-w-6xl mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-8">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>Now in Public Beta — Free forever for small teams</span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold tracking-tight leading-[1.05] mb-6">
                        Ship faster with your{' '}
                        <br className="hidden sm:block" />
                        <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                            whole team aligned
                        </span>
                    </h1>

                    <p className="mx-auto max-w-2xl text-lg sm:text-xl text-muted-foreground mb-10 leading-relaxed">
                        FlowDesk combines Linear-style project tracking with Notion-style docs.
                        Real-time collaboration, Kanban boards, RBAC, and subscription billing — all in one.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                        <Link
                            href="/register"
                            className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold text-base hover:opacity-90 transition-all duration-200 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
                        >
                            Start for free
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                        <Link
                            href="#features"
                            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-border hover:border-primary/40 bg-background/50 hover:bg-accent/50 text-foreground font-semibold text-base transition-all duration-200"
                        >
                            Explore features
                        </Link>
                    </div>

                    {/* App Preview */}
                    <div className="relative max-w-5xl mx-auto">
                        {/* Glow */}
                        <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 blur-2xl rounded-3xl" />
                        <div className="relative rounded-2xl border border-border/60 bg-card shadow-2xl overflow-hidden">
                            {/* Browser chrome */}
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/40">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-400/60" />
                                    <div className="w-3 h-3 rounded-full bg-amber-400/60" />
                                    <div className="w-3 h-3 rounded-full bg-emerald-400/60" />
                                </div>
                                <div className="flex-1 flex justify-center">
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-background/60 border border-border/40 text-xs text-muted-foreground font-mono w-64">
                                        <div className="w-3 h-3 rounded-full bg-emerald-400/50 flex-shrink-0" />
                                        flowdesk.app/acme-corp/eng/board
                                    </div>
                                </div>
                                <div className="w-16" />
                            </div>

                            {/* Dashboard mockup */}
                            <div className="p-5 bg-background">
                                {/* Stats row */}
                                <div className="grid grid-cols-4 gap-3 mb-5">
                                    {[
                                        { label: 'My Tasks', val: '12', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                                        { label: 'Completed', val: '8', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                                        { label: 'Overdue', val: '2', color: 'text-red-500', bg: 'bg-red-500/10' },
                                        { label: 'Unread', val: '5', color: 'text-purple-500', bg: 'bg-purple-500/10' },
                                    ].map((s) => (
                                        <div key={s.label} className="rounded-lg border border-border/50 bg-card p-3">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</span>
                                                <div className={`w-5 h-5 rounded-md ${s.bg} flex items-center justify-center`}>
                                                    <div className={`w-2 h-2 rounded-sm ${s.color.replace('text-', 'bg-')}`} />
                                                </div>
                                            </div>
                                            <div className={`text-xl font-bold ${s.color}`}>{s.val}</div>
                                        </div>
                                    ))}
                                </div>
                                {/* Kanban columns */}
                                <div className="grid grid-cols-4 gap-3">
                                    {(['Todo', 'In Progress', 'In Review', 'Done'] as const).map((col, ci) => (
                                        <div key={col} className="space-y-2">
                                            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                                <div className={`w-1.5 h-1.5 rounded-full ${ci === 0 ? 'bg-slate-400' : ci === 1 ? 'bg-blue-500' : ci === 2 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                                {col}
                                                <span className="ml-auto bg-muted text-muted-foreground rounded px-1 text-[10px]">{[4, 3, 2, 5][ci]}</span>
                                            </div>
                                            {Array.from({ length: ci === 3 ? 2 : 3 }).map((_, i) => (
                                                <div key={i} className="rounded-md border border-border/50 bg-card p-2.5 space-y-1.5">
                                                    <div className="h-2.5 bg-muted rounded w-full" />
                                                    <div className="h-2 bg-muted/60 rounded w-2/3" />
                                                    <div className="flex items-center gap-1.5 pt-0.5">
                                                        <div className="w-4 h-4 rounded-full bg-primary/20" />
                                                        <div className="h-1.5 bg-muted/40 rounded w-10" />
                                                        <div className={`ml-auto h-1.5 w-6 rounded-full ${ci === 0 ? 'bg-slate-400/50' : ci === 1 ? 'bg-blue-500/50' : 'bg-amber-500/50'}`} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Social Proof Strip ────────────────────────────── */}
            <div className="border-y border-border/50 bg-muted/30 py-4">
                <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
                    {['Next.js 15', 'tRPC v11', 'DrizzleORM', 'Firebase Auth', 'Socket.io', 'Stripe', 'Turborepo'].map((tech) => (
                        <span key={tech} className="font-medium opacity-60 hover:opacity-100 transition-opacity">{tech}</span>
                    ))}
                </div>
            </div>

            {/* ─── Features ─────────────────────────────────────── */}
            <section id="features" className="py-24 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-sm font-semibold text-primary uppercase tracking-widest mb-3 block">Features</span>
                        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                            Everything your team needs
                        </h2>
                        <p className="text-muted-foreground max-w-xl mx-auto text-lg">
                            Built for modern engineering teams who want speed, clarity, and real-time collaboration.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {FEATURES.map((feat) => (
                            <div
                                key={feat.title}
                                className={`p-5 rounded-xl border bg-gradient-to-br ${feat.color} hover:scale-[1.02] transition-transform duration-200 group cursor-default`}
                            >
                                <div className={`w-9 h-9 rounded-lg bg-background/80 flex items-center justify-center mb-3`}>
                                    <feat.icon className={`w-4.5 h-4.5 ${feat.iconColor}`} />
                                </div>
                                <h3 className="font-semibold text-sm mb-1.5">{feat.title}</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Testimonials ─────────────────────────────────── */}
            <section className="py-20 px-4 bg-muted/30 border-y border-border/50">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="text-sm font-semibold text-primary uppercase tracking-widest mb-3 block">Testimonials</span>
                        <h2 className="text-3xl font-bold tracking-tight">Loved by product teams</h2>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-5">
                        {TESTIMONIALS.map((t) => (
                            <div key={t.name} className="rounded-xl border border-border/60 bg-card p-5 flex flex-col gap-4">
                                <div className="flex gap-0.5 mb-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                    ))}
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed flex-1">&quot;{t.text}&quot;</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                        {t.avatar}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">{t.name}</p>
                                        <p className="text-xs text-muted-foreground">{t.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Pricing ──────────────────────────────────────── */}
            <section id="pricing" className="py-24 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-sm font-semibold text-primary uppercase tracking-widest mb-3 block">Pricing</span>
                        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                            Simple, transparent pricing
                        </h2>
                        <p className="text-muted-foreground text-lg">Start free. Upgrade as your team grows.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-5">
                        {PLANS.map((plan) => (
                            <div
                                key={plan.name}
                                className={`relative rounded-2xl border p-6 flex flex-col transition-all duration-200 hover:-translate-y-1 ${plan.popular
                                    ? 'border-primary bg-gradient-to-b from-primary/5 to-transparent shadow-xl shadow-primary/10'
                                    : 'border-border/60 bg-card hover:border-border'
                                    }`}
                            >
                                {plan.badge && (
                                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-semibold">
                                        {plan.badge}
                                    </div>
                                )}
                                <div className="mb-5">
                                    <h3 className="text-lg font-bold">{plan.name}</h3>
                                    <div className="mt-2 flex items-baseline gap-1">
                                        <span className="text-4xl font-extrabold">{plan.price}</span>
                                        {plan.period && <span className="text-muted-foreground text-sm">{plan.period} per org</span>}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">{plan.desc}</p>
                                </div>

                                <ul className="space-y-2.5 flex-1 mb-6">
                                    {plan.features.map((f) => (
                                        <li key={f} className="flex items-center gap-2.5 text-sm">
                                            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                <Link
                                    href={plan.href}
                                    className={`w-full py-2.5 rounded-xl text-center text-sm font-semibold transition-all duration-200 block ${plan.popular
                                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90 shadow-md'
                                        : 'bg-secondary text-foreground hover:bg-accent'
                                        }`}
                                >
                                    {plan.cta}
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Final CTA ────────────────────────────────────── */}
            <section className="py-24 px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="relative inline-block">
                        <div className="absolute -inset-8 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-2xl rounded-full" />
                        <h2 className="relative text-3xl sm:text-5xl font-extrabold tracking-tight mb-6">
                            Ready to ship faster?
                        </h2>
                    </div>
                    <p className="text-muted-foreground text-lg mb-10">
                        Join teams already using FlowDesk to stay aligned and move faster.
                        Free forever for small teams.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/register"
                            className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold text-base hover:opacity-90 transition-all shadow-lg shadow-primary/25 hover:-translate-y-0.5"
                        >
                            Get started free
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                        <a
                            href="https://github.com/Jabirmahmud0/FlowDesk"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-4 rounded-xl border border-border hover:border-primary/30 bg-background/50 hover:bg-accent/50 text-foreground font-semibold text-base transition-all"
                        >
                            <Github className="w-4 h-4" />
                            View on GitHub
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}
