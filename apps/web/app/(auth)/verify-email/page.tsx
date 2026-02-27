'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { sendEmailVerification, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { Check, ArrowLeft, Loader2, Mail, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function VerifyEmailPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [verified, setVerified] = useState(false);
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.push('/login');
                return;
            }
            setEmail(user.email || '');
            if (user.emailVerified) {
                setVerified(true);
            }
        });
        return () => unsubscribe();
    }, [router]);

    // Cooldown timer
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    const handleSendVerification = async () => {
        setIsLoading(true);
        setError('');

        try {
            const user = auth.currentUser;
            if (!user) {
                setError('No user found. Please log in again.');
                return;
            }
            if (user.emailVerified) {
                setVerified(true);
                return;
            }
            await sendEmailVerification(user);
            setSent(true);
            setCooldown(60);
        } catch (err: any) {
            if (err.code === 'auth/too-many-requests') {
                setError('Too many requests. Please wait a minute and try again.');
                setCooldown(60);
            } else {
                setError('Failed to send verification email. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleCheckVerification = async () => {
        setIsLoading(true);
        try {
            const user = auth.currentUser;
            if (user) {
                await user.reload();
                if (user.emailVerified) {
                    setVerified(true);
                } else {
                    setError('Email not yet verified. Please check your inbox.');
                }
            }
        } catch {
            setError('Failed to check verification status.');
        } finally {
            setIsLoading(false);
        }
    };

    if (verified) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-background to-muted/50">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold">Email Verified!</CardTitle>
                        <CardDescription>
                            Your email has been successfully verified
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center space-y-4">
                            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                You can now access all features of FlowDesk.
                            </p>
                            <Button asChild className="w-full">
                                <Link href="/dashboard">
                                    Continue to Dashboard
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-background to-muted/50">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
                    <CardDescription>
                        {sent
                            ? 'Check your inbox for a verification link'
                            : 'We need to verify your email address to continue'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {sent ? (
                        <div className="space-y-4">
                            <div className="text-center space-y-4">
                                <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    We sent a verification link to <strong>{email}</strong>.
                                    Please check your inbox and spam folder.
                                </p>
                            </div>

                            <Button
                                className="w-full"
                                onClick={handleCheckVerification}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                )}
                                I've Verified — Check Status
                            </Button>

                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={handleSendVerification}
                                disabled={isLoading || cooldown > 0}
                            >
                                {cooldown > 0 ? (
                                    `Resend in ${cooldown}s`
                                ) : (
                                    <>
                                        <Mail className="mr-2 h-4 w-4" />
                                        Resend Verification Email
                                    </>
                                )}
                            </Button>

                            {error && (
                                <p className="text-sm text-destructive text-center">{error}</p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground text-center">
                                A verification email will be sent to <strong>{email}</strong>.
                            </p>

                            {error && (
                                <p className="text-sm text-destructive text-center">{error}</p>
                            )}

                            <Button
                                className="w-full"
                                onClick={handleSendVerification}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Mail className="mr-2 h-4 w-4" />
                                )}
                                Send Verification Email
                            </Button>

                            <div className="text-center">
                                <Link
                                    href="/login"
                                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <ArrowLeft className="inline mr-1 h-3 w-3" />
                                    Back to Login
                                </Link>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
