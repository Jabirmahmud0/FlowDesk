'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { ArrowRight, ArrowLeft, CheckCircle2, Building2, FolderKanban, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
    { title: 'Create Organization', description: 'Set up your company or team' },
    { title: 'First Workspace', description: 'Organize your work into a workspace' },
    { title: 'Ready!', description: 'You\u2019re all set to start' },
];

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [orgName, setOrgName] = useState('');
    const [orgSlug, setOrgSlug] = useState('');
    const [wsName, setWsName] = useState('General');
    const [isLoading, setIsLoading] = useState(false);
    const [createdOrgSlug, setCreatedOrgSlug] = useState('');

    const createOrg = trpc.org.create.useMutation();
    const createWorkspace = trpc.workspace.create.useMutation();

    const handleOrgNameChange = (value: string) => {
        setOrgName(value);
        setOrgSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    };

    const handleNext = async () => {
        if (step === 0) {
            // Create org
            setIsLoading(true);
            try {
                const org = await createOrg.mutateAsync({ name: orgName, slug: orgSlug });
                setCreatedOrgSlug(orgSlug);
                setStep(1);
            } catch (err: any) {
                console.error('Failed to create org:', err);
            } finally {
                setIsLoading(false);
            }
        } else if (step === 1) {
            // Skip workspace creation — default 'General' workspace is already created by org.create
            setStep(2);
        } else {
            // Navigate to the new org
            router.push(`/${createdOrgSlug}`);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-background via-background to-muted/50">
            <div className="w-full max-w-lg space-y-8">
                {/* Progress */}
                <div className="flex items-center justify-center gap-2">
                    {STEPS.map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                'h-2 rounded-full transition-all duration-300',
                                i === step ? 'w-8 bg-primary' : i < step ? 'w-8 bg-primary/60' : 'w-8 bg-muted'
                            )}
                        />
                    ))}
                </div>

                <Card className="border-2">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-2xl">{STEPS[step].title}</CardTitle>
                        <CardDescription>{STEPS[step].description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-4">
                        {/* Step 0: Create Org */}
                        {step === 0 && (
                            <>
                                <div className="flex justify-center mb-4">
                                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                                        <Building2 className="h-8 w-8 text-primary" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="org-name">Organization Name</Label>
                                    <Input
                                        id="org-name"
                                        placeholder="Acme Inc."
                                        value={orgName}
                                        onChange={(e) => handleOrgNameChange(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="org-slug">URL Slug</Label>
                                    <Input
                                        id="org-slug"
                                        placeholder="acme-inc"
                                        value={orgSlug}
                                        onChange={(e) => setOrgSlug(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        flowdesk.app/<strong>{orgSlug || 'your-org'}</strong>
                                    </p>
                                </div>
                            </>
                        )}

                        {/* Step 1: Workspace */}
                        {step === 1 && (
                            <>
                                <div className="flex justify-center mb-4">
                                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                                        <FolderKanban className="h-8 w-8 text-blue-500" />
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground text-center">
                                    A default workspace named <strong>"General"</strong> has been created for you.
                                    You can create more workspaces later from the sidebar.
                                </p>
                                <div className="space-y-2">
                                    <Label>Default Workspace</Label>
                                    <Input value="General" disabled />
                                </div>
                            </>
                        )}

                        {/* Step 2: Done */}
                        {step === 2 && (
                            <div className="text-center space-y-4 py-4">
                                <div className="flex justify-center">
                                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                        <Sparkles className="h-8 w-8 text-green-600 dark:text-green-400" />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-lg font-semibold">You're all set!</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Your organization <strong>{orgName}</strong> is ready.
                                        Start by creating your first project.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Navigation */}
                        <div className="flex justify-between pt-4">
                            <Button
                                variant="ghost"
                                onClick={() => setStep(Math.max(0, step - 1))}
                                disabled={step === 0}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                            <Button
                                onClick={handleNext}
                                disabled={isLoading || (step === 0 && (!orgName || !orgSlug))}
                            >
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : step === 2 ? (
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                ) : (
                                    <ArrowRight className="mr-2 h-4 w-4" />
                                )}
                                {step === 2 ? 'Go to Dashboard' : 'Next'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
