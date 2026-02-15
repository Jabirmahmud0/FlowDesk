'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Layout, Eye, EyeOff, ArrowRight, Chrome, AlertCircle } from 'lucide-react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const idToken = await result.user.getIdToken();

            const res = await signIn('credentials', {
                idToken,
                redirect: false,
            });

            if (res?.error) {
                console.error('NextAuth Error:', res.error);
                setError('Failed to synchronize session. Please try again.');
            } else {
                router.push('/');
                router.refresh();
            }
        } catch (err: any) {
            console.error('Google Login Error:', err);
            setError(err.message || 'Failed to sign in with Google');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const idToken = await userCredential.user.getIdToken();

            const res = await signIn('credentials', {
                idToken,
                redirect: false,
            });

            if (res?.error) {
                console.error('NextAuth Error:', res.error);
                setError('Failed to synchronize session. Please try again.');
            } else {
                router.push('/');
                router.refresh();
            }
        } catch (err: any) {
            console.error('Login Error:', err);
            setError('Invalid email or password.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* ─── Left: Branding Panel ────────────────────────── */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden gradient-primary">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:48px_48px]" />
                <div className="relative z-10 flex flex-col justify-center px-16">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                            <Layout className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-white tracking-tight">FlowDesk</span>
                    </div>
                    <h2 className="text-4xl font-bold text-white leading-tight mb-4">
                        Manage projects
                        <br />
                        with your team,
                        <br />
                        in real-time.
                    </h2>
                    <p className="text-white/70 text-lg max-w-md">
                        Kanban boards, rich documents, and seamless collaboration — all org-scoped with
                        enterprise-grade access control.
                    </p>
                </div>
            </div>

            {/* ─── Right: Login Form ───────────────────────────── */}
            <div className="flex-1 flex items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-md"
                >
                    <div className="lg:hidden flex items-center gap-2 mb-8">
                        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                            <Layout className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-xl font-bold">FlowDesk</span>
                    </div>

                    <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
                    <p className="text-muted-foreground text-sm mb-8">
                        Sign in to your account to continue
                    </p>

                    {error && (
                        <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* OAuth */}
                    <div className="space-y-3 mb-6">
                        <button
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-border bg-card hover:bg-accent transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Chrome className="w-4 h-4" />
                            Continue with Google
                        </button>
                    </div>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-xs text-muted-foreground uppercase">or</span>
                        <div className="flex-1 h-px bg-border" />
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@company.com"
                                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
                                required
                                suppressHydrationWarning
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label htmlFor="password" className="text-sm font-medium">
                                    Password
                                </label>
                                <Link
                                    href="/forgot-password"
                                    className="text-xs text-primary hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg gradient-primary text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Sign In <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        Don&apos;t have an account?{' '}
                        <Link href="/register" className="text-primary font-medium hover:underline">
                            Create one
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
