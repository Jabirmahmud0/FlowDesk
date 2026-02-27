import Link from 'next/link';
import { ArrowRight, Layout } from 'lucide-react';
import { auth } from '@/lib/auth';

export default async function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

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
                            href="/#features"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Features
                        </Link>
                        <Link
                            href="/pricing"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Pricing
                        </Link>
                        {session ? (
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
                            >
                                Go to Dashboard <ArrowRight className="w-4 h-4" />
                            </Link>
                        ) : (
                            <>
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
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* ─── Content ──────────────────────────────────── */}
            {children}

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
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <Link href="/pricing" className="hover:text-foreground transition-colors">
                            Pricing
                        </Link>
                        <Link href="/#features" className="hover:text-foreground transition-colors">
                            Features
                        </Link>
                        <Link href="https://github.com" className="hover:text-foreground transition-colors">
                            GitHub
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
