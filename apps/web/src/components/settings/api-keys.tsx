'use client';

import { useState } from 'react';
import { useOrg } from '@/hooks/use-org';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { PlanRestrictionBanner } from '@/components/billing/plan-restriction-banner';
import { Key, Copy, Trash2, Check, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';

export function ApiKeysSettings() {
    const { org } = useOrg();
    const { toast } = useToast();
    const [showKey, setShowKey] = useState<string | null>(null);

    const { data: apiKeys, isLoading } = trpc.apiKey.list.useQuery(
        { orgId: org?.id! },
        { enabled: !!org?.id }
    );

    const createKey = trpc.apiKey.create.useMutation({
        onSuccess: (data) => {
            setShowKey(data.key);
            toast({
                title: 'API Key created',
                description: 'Copy your key now - it won\'t be shown again!',
            });
        },
    });

    const revokeKey = trpc.apiKey.revoke.useMutation({
        onSuccess: () => {
            toast({ title: 'API Key revoked' });
        },
    });

    const copyKey = (key: string) => {
        navigator.clipboard.writeText(key);
        toast({ title: 'Copied to clipboard' });
    };

    if (!org) return null;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    <div>
                        <CardTitle>API Access</CardTitle>
                        <CardDescription>
                            Generate API keys to access FlowDesk programmatically (Pro plan required)
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <PlanRestrictionBanner currentPlan={org.plan} feature="apiAccess" orgId={org.id} />

                <Button
                    onClick={() => createKey.mutate({ orgId: org.id, name: `Key ${new Date().toLocaleDateString()}` })}
                    disabled={createKey.isPending}
                >
                    Generate New Key
                </Button>

                {showKey && (
                    <div className="p-4 border rounded-md bg-muted font-mono text-sm flex items-center gap-2">
                        <code className="flex-1 truncate">{showKey}</code>
                        <Button size="sm" variant="ghost" onClick={() => copyKey(showKey)}>
                            <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowKey(null)}>
                            <EyeOff className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                <div className="space-y-2">
                    <Label>Active API Keys</Label>
                    {isLoading ? (
                        <p className="text-sm text-muted-foreground">Loading...</p>
                    ) : apiKeys?.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No API keys generated</p>
                    ) : (
                        <div className="space-y-2">
                            {apiKeys?.map((key) => (
                                <div
                                    key={key.id}
                                    className="flex items-center gap-4 p-3 border rounded-md"
                                >
                                    <div className="flex-1">
                                        <div className="font-medium">{key.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                            Created {format(new Date(key.createdAt), 'MMM d, yyyy')}
                                            {key.lastUsedAt && (
                                                <span> • Last used {format(new Date(key.lastUsedAt), 'MMM d, yyyy')}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={key.revoked ? 'destructive' : 'default'}>
                                            {key.revoked ? 'Revoked' : 'Active'}
                                        </Badge>
                                        {!key.revoked && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => copyKey(key.partialKey + '...')}
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => revokeKey.mutate({ id: key.id })}
                                                    className="text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
