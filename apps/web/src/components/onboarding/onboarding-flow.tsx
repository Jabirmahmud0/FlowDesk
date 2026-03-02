'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight, ArrowLeft, Building2, Users, FolderKanban, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { trpc } from '@/lib/trpc';
import { useRouter } from 'next/navigation';

const steps = [
    {
        id: 1,
        title: 'Create Organization',
        description: 'Start by creating your organization',
        icon: Building2,
    },
    {
        id: 2,
        title: 'Invite Team',
        description: 'Add your team members',
        icon: Users,
    },
    {
        id: 3,
        title: 'Create Workspace',
        description: 'Set up your first workspace',
        icon: FolderKanban,
    },
    {
        id: 4,
        title: 'Create Project',
        description: 'Start tracking tasks',
        icon: FolderKanban,
    },
];

export function OnboardingFlow() {
    const router = useRouter();
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState(1);

    // Form states
    const [orgName, setOrgName] = useState('');
    const [orgSlug, setOrgSlug] = useState('');
    const [inviteEmails, setInviteEmails] = useState<string[]>(['']);
    const [workspaceName, setWorkspaceName] = useState('');
    const [workspaceSlug, setWorkspaceSlug] = useState('');
    const [projectName, setProjectName] = useState('');
    const [projectSlug, setProjectSlug] = useState('');

    const createOrg = trpc.org.create.useMutation();
    const createWorkspace = trpc.workspace.create.useMutation();
    const createProject = trpc.project.create.useMutation();
    const inviteMember = trpc.members.invite.useMutation();

    const handleNext = async () => {
        if (currentStep === 1 && orgName && orgSlug) {
            try {
                const org = await createOrg.mutateAsync({ name: orgName, slug: orgSlug });
                toast({ title: 'Organization created' });
                setCurrentStep(2);
            } catch (err: any) {
                toast({ title: 'Error', description: err.message, variant: 'destructive' });
            }
        } else if (currentStep === 2) {
            setCurrentStep(3);
        } else if (currentStep === 3 && workspaceName && workspaceSlug) {
            setCurrentStep(4);
        } else if (currentStep === 4 && projectName && projectSlug) {
            // Complete onboarding
            router.push(`/`);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const StepIcon = steps[currentStep - 1]?.icon;

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl"
            >
                {/* Progress Steps */}
                <div className="flex items-center justify-between mb-8">
                    {steps.map((step, index) => (
                        <div key={step.id} className="flex items-center">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${index + 1 <= currentStep
                                        ? 'bg-primary border-primary text-primary-foreground'
                                        : 'border-muted bg-muted text-muted-foreground'
                                    }`}
                            >
                                {index + 1 < currentStep ? (
                                    <Check className="h-5 w-5" />
                                ) : (
                                    <step.icon className="h-5 w-5" />
                                )}
                            </div>
                            {index < steps.length - 1 && (
                                <div
                                    className={`w-16 h-0.5 mx-2 ${index + 1 < currentStep ? 'bg-primary' : 'bg-muted'
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                <Card>
                    <CardHeader>
                        <CardTitle>{steps[currentStep - 1]?.title}</CardTitle>
                        <CardDescription>{steps[currentStep - 1]?.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {currentStep === 1 && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Organization Name</Label>
                                    <Input
                                        value={orgName}
                                        onChange={(e) => {
                                            setOrgName(e.target.value);
                                            setOrgSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                                        }}
                                        placeholder="Acme Corp"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Organization Slug</Label>
                                    <Input
                                        value={orgSlug}
                                        onChange={(e) => setOrgSlug(e.target.value)}
                                        placeholder="acme-corp"
                                        className="font-mono"
                                    />
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Invite team members to collaborate (optional)
                                </p>
                                {inviteEmails.map((email, index) => (
                                    <div key={index} className="flex gap-2">
                                        <Input
                                            type="email"
                                            value={email}
                                            onChange={(e) => {
                                                const newEmails = [...inviteEmails];
                                                newEmails[index] = e.target.value;
                                                setInviteEmails(newEmails);
                                            }}
                                            placeholder="team@example.com"
                                        />
                                        {index === inviteEmails.length - 1 && (
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => setInviteEmails([...inviteEmails, ''])}
                                            >
                                                <Users className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Workspace Name</Label>
                                    <Input
                                        value={workspaceName}
                                        onChange={(e) => {
                                            setWorkspaceName(e.target.value);
                                            setWorkspaceSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                                        }}
                                        placeholder="Engineering"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Workspace Slug</Label>
                                    <Input
                                        value={workspaceSlug}
                                        onChange={(e) => setWorkspaceSlug(e.target.value)}
                                        placeholder="engineering"
                                        className="font-mono"
                                    />
                                </div>
                            </div>
                        )}

                        {currentStep === 4 && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Project Name</Label>
                                    <Input
                                        value={projectName}
                                        onChange={(e) => {
                                            setProjectName(e.target.value);
                                            setProjectSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                                        }}
                                        placeholder="Product Launch"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Project Slug</Label>
                                    <Input
                                        value={projectSlug}
                                        onChange={(e) => setProjectSlug(e.target.value)}
                                        placeholder="product-launch"
                                        className="font-mono"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Navigation */}
                        <div className="flex justify-between mt-6">
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                disabled={currentStep === 1}
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                            <Button onClick={handleNext}>
                                {currentStep === steps.length ? 'Get Started' : 'Continue'}
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
