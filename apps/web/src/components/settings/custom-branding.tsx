'use client';

import { useState } from 'react';
import { useOrg } from '@/hooks/use-org';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { PlanRestrictionBanner } from '@/components/billing/plan-restriction-banner';
import { Paintbrush } from 'lucide-react';

export function CustomBrandingSettings() {
    const { org } = useOrg();
    const { toast } = useToast();
    const [primaryColor, setPrimaryColor] = useState('#000000');
    const [secondaryColor, setSecondaryColor] = useState('#000000');
    const [logoUrl, setLogoUrl] = useState('');

    const updateOrg = trpc.organization.update.useMutation({
        onSuccess: () => {
            toast({
                title: 'Branding updated',
                description: 'Your custom branding has been saved.',
            });
        },
        onError: (err) => {
            toast({
                title: 'Error',
                description: err.message,
                variant: 'destructive',
            });
        },
    });

    const handleSave = () => {
        if (!org?.id) return;
        updateOrg.mutate({
            orgId: org.id,
            logoUrl: logoUrl || null,
            // Note: Add customColor fields to schema if needed
        });
    };

    if (!org) return null;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Paintbrush className="h-5 w-5" />
                    <div>
                        <CardTitle>Custom Branding</CardTitle>
                        <CardDescription>
                            Customize your workspace colors and logo (Team plan only)
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <PlanRestrictionBanner currentPlan={org.plan} feature="customBranding" orgId={org.id} />

                <div className="grid gap-4">
                    <div className="space-y-2">
                        <Label>Primary Color</Label>
                        <div className="flex gap-2">
                            <Input
                                type="color"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                className="w-20 h-10"
                            />
                            <Input
                                type="text"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                className="flex-1"
                                placeholder="#000000"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Secondary Color</Label>
                        <div className="flex gap-2">
                            <Input
                                type="color"
                                value={secondaryColor}
                                onChange={(e) => setSecondaryColor(e.target.value)}
                                className="w-20 h-10"
                            />
                            <Input
                                type="text"
                                value={secondaryColor}
                                onChange={(e) => setSecondaryColor(e.target.value)}
                                className="flex-1"
                                placeholder="#000000"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Logo URL</Label>
                        <Input
                            value={logoUrl}
                            onChange={(e) => setLogoUrl(e.target.value)}
                            placeholder="https://example.com/logo.png"
                        />
                    </div>

                    <Button onClick={handleSave} disabled={updateOrg.isPending}>
                        Save Branding
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
