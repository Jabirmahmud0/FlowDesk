import Link from 'next/link';
import {
    ArrowRight,
    Kanban,
    Users,
    Shield,
    Zap,
    Layout,
    CreditCard,
    Globe,
    Star,
} from 'lucide-react';

export default function HomePage() {
    return (
        <div className="min-h-screen bg-background">
            {/* ─── Navigation ──────────────────────────────────── */}
            <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
                <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                            <Layout className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">FlowDesk</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        <Link
                            href="#features"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Features
                        </Link>
                        <Link
                            href="#pricing"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Pricing
                        </Link>
                        <Link
                            href="/login"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/register"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                            Get Started <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ─── Hero Section ────────────────────────────────── */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                {/* Background grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />

                <div className="relative mx-auto max-w-6xl px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
                        <Star className="w-3.5 h-3.5" />
                        <span>Now in Public Beta</span>
                    </div>

                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6">
                        Project management
                        <br />
                        <span className="gradient-text">for modern teams</span>
                    </h1>

                    <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-10 leading-relaxed">
                        Combine Linear-style project tracking with Notion-style docs. Real-time collaboration,
                        Kanban boards, subscription billing, and workspace-scoped RBAC — all in one platform.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/register"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-white font-semibold text-base hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 animate-glow"
                        >
                            Start for Free <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            href="#features"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold text-base hover:bg-accent transition-colors"
                        >
                            See Features
                        </Link>
                    </div>

                    {/* ─── Dashboard Preview ──────────────────────────── */}
                    <div className="mt-16 relative">
                        <div className="absolute inset-0 gradient-primary opacity-10 blur-3xl rounded-3xl" />
                        <div className="relative rounded-2xl border border-border/50 bg-card overflow-hidden shadow-2xl shadow-primary/5">
                            <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border/50">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-destructive/60" />
                                    <div className="w-3 h-3 rounded-full bg-warning/60" />
                                    <div className="w-3 h-3 rounded-full bg-success/60" />
                                </div>
                                <div className="flex-1 text-center text-xs text-muted-foreground font-mono">
                                    flowdesk.app/acme-corp/engineering/projects/launch
                                </div>
                            </div>

                            {/* Kanban Preview */}
                            <div className="p-6 grid grid-cols-4 gap-4 min-h-[360px]">
                                {(['Todo', 'In Progress', 'In Review', 'Done'] as const).map((col, ci) => (
                                    <div key={col} className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                            <div
                                                className={`w-2 h-2 rounded-full ${ci === 0
                                                        ? 'bg-muted-foreground'
                                                        : ci === 1
                                                            ? 'bg-primary'
                                                            : ci === 2
                                                                ? 'bg-warning'
                                                                : 'bg-success'
                                                    }`}
                                            />
                                            {col}
                                            <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">
                                                {ci === 0 ? 4 : ci === 1 ? 3 : ci === 2 ? 2 : 5}
                                            </span>
                                        </div>
                                        {Array.from({ length: ci === 0 ? 3 : ci === 3 ? 2 : 2 }).map((_, i) => (
                                            <div
                                                key={i}
                                                className="rounded-lg border border-border/60 bg-card p-3 space-y-2 hover:border-primary/30 transition-colors cursor-default"
                                            >
                                                <div className="h-3 bg-muted rounded w-3/4" />
                                                <div className="h-2 bg-muted/60 rounded w-1/2" />
                                                <div className="flex items-center gap-2 pt-1">
                                                    <div className="w-5 h-5 rounded-full bg-primary/20" />
                                                    <div className="h-2 bg-muted/40 rounded w-12" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Features Section ────────────────────────────── */}
            <section id="features" className="py-24 bg-muted/30">
                <div className="mx-auto max-w-6xl px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold tracking-tight mb-3">
                            Everything your team needs
                        </h2>
                        <p className="text-muted-foreground max-w-lg mx-auto">
                            Built for modern teams who want speed, clarity, and seamless collaboration.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                icon: Kanban,
                                title: 'Kanban Board',
                                desc: 'Drag-and-drop task management with real-time sync across all connected clients.',
                            },
                            {
                                icon: Users,
                                title: 'Multi-Tenant Workspaces',
                                desc: 'Organization-scoped data isolation. Users can belong to multiple orgs with role-based access.',
                            },
                            {
                                icon: Shield,
                                title: 'RBAC Permissions',
                                desc: 'Owner, Admin, Member, Viewer — roles scoped per workspace, enforced server-side.',
                            },
                            {
                                icon: Zap,
                                title: 'Real-Time Collaboration',
                                desc: 'Socket.io powered live updates, presence indicators, and instant task sync.',
                            },
                            {
                                icon: Layout,
                                title: 'Rich Text Documents',
                                desc: 'Notion-style docs with Tiptap editor, @mentions, slash commands, and auto-save.',
                            },
                            {
                                icon: CreditCard,
                                title: 'Subscription Billing',
                                desc: 'Stripe-powered plans with usage limits, self-serve portal, and webhook processing.',
                            },
                        ].map((feat) => (
                            <div
                                key={feat.title}
                                className="p-6 rounded-xl border border-border/60 bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                    <feat.icon className="w-5 h-5 text-primary" />
                                </div>
                                <h3 className="font-semibold text-base mb-2">{feat.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Pricing Section ─────────────────────────────── */}
            <section id="pricing" className="py-24">
                <div className="mx-auto max-w-5xl px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold tracking-tight mb-3">Simple, transparent pricing</h2>
                        <p className="text-muted-foreground">Start free. Upgrade as your team grows.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                name: 'Free',
                                price: '$0',
                                desc: 'For small teams getting started',
                                features: ['3 members', '3 projects', '100MB storage', '7-day activity log'],
                                cta: 'Get Started',
                                popular: false,
                            },
                            {
                                name: 'Pro',
                                price: '$12',
                                desc: 'For growing teams that need more',
                                features: [
                                    '10 members',
                                    'Unlimited projects',
                                    '5GB storage',
                                    '90-day activity log',
                                    'Guest access',
                                    'Analytics',
                                ],
                                cta: 'Start Pro Trial',
                                popular: true,
                            },
                            {
                                name: 'Team',
                                price: '$29',
                                desc: 'For organizations at scale',
                                features: [
                                    'Unlimited members',
                                    'Unlimited projects',
                                    '20GB storage',
                                    'Unlimited activity log',
                                    'Advanced analytics',
                                    'Custom branding',
                                ],
                                cta: 'Contact Sales',
                                popular: false,
                            },
                        ].map((plan) => (
                            <div
                                key={plan.name}
                                className={`relative rounded-2xl border p-6 flex flex-col ${plan.popular
                                        ? 'border-primary shadow-xl shadow-primary/10 scale-[1.02]'
                                        : 'border-border/60 bg-card'
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full gradient-primary text-white text-xs font-medium">
                                        Most Popular
                                    </div>
                                )}
                                <h3 className="text-lg font-semibold">{plan.name}</h3>
                                <div className="mt-2 mb-1">
                                    <span className="text-4xl font-extrabold">{plan.price}</span>
                                    {plan.price !== '$0' && (
                                        <span className="text-muted-foreground text-sm">/mo per org</span>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-6">{plan.desc}</p>

                                <ul className="space-y-2.5 mb-8 flex-1">
                                    {plan.features.map((f) => (
                                        <li key={f} className="flex items-center gap-2 text-sm">
                                            <div className="w-4 h-4 rounded-full bg-success/20 flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 rounded-full bg-success" />
                                            </div>
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                <Link
                                    href="/register"
                                    className={`w-full py-2.5 rounded-lg text-center text-sm font-medium transition-colors ${plan.popular
                                            ? 'gradient-primary text-white hover:opacity-90'
                                            : 'bg-secondary text-secondary-foreground hover:bg-accent'
                                        }`}
                                >
                                    {plan.cta}
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Footer ──────────────────────────────────────── */}
            <footer className="border-t border-border/50 py-10">
                <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md gradient-primary flex items-center justify-center">
                            <Layout className="w-3 h-3 text-white" />
                        </div>
                        <span className="font-semibold text-sm">FlowDesk</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} FlowDesk. Built as a portfolio project.
                    </p>
                    <div className="flex items-center gap-4">
                        <Link
                            href="https://github.com"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Globe className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
