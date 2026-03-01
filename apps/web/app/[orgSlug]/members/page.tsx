'use client';

import { useState } from 'react';
import { useOrg } from '@/hooks/use-org';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { 
    UserPlus, 
    Loader2, 
    Mail, 
    Trash2, 
    Shield, 
    UserCheck,
    Clock,
    CheckCircle2
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';

const ROLE_LABELS: Record<string, { label: string; description: string }> = {
    OWNER: { label: 'Owner', description: 'Full access to everything' },
    ADMIN: { label: 'Admin', description: 'Can manage members and settings' },
    MEMBER: { label: 'Member', description: 'Can view and create content' },
    VIEWER: { label: 'Viewer', description: 'Read-only access' },
};

export default function MembersPage() {
    const { org } = useOrg();
    const { toast } = useToast();
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MEMBER' | 'VIEWER'>('MEMBER');

    const utils = trpc.useUtils();

    const { data: members, isLoading } = trpc.members.list.useQuery(
        { orgId: org?.id! },
        { enabled: !!org?.id }
    );

    const { data: invitations } = trpc.members.listInvitations.useQuery(
        { orgId: org?.id! },
        { enabled: !!org?.id }
    );

    const inviteMutation = trpc.members.invite.useMutation({
        onSuccess: () => {
            toast({
                title: 'Invitation sent',
                description: `Invitation sent to ${inviteEmail}`,
            });
            setInviteEmail('');
            setInviteDialogOpen(false);
            utils.members.list.invalidate();
            utils.members.listInvitations.invalidate();
        },
        onError: (err) => {
            toast({
                title: 'Error',
                description: err.message,
                variant: 'destructive',
            });
        },
    });

    const updateRoleMutation = trpc.members.updateRole.useMutation({
        onSuccess: () => {
            toast({
                title: 'Role updated',
                description: 'Member role has been updated.',
            });
            utils.members.list.invalidate();
            utils.org.getBySlug.invalidate();
        },
        onError: (err) => {
            toast({
                title: 'Error',
                description: err.message,
                variant: 'destructive',
            });
        },
    });

    const removeMemberMutation = trpc.members.remove.useMutation({
        onSuccess: () => {
            toast({
                title: 'Member removed',
                description: 'The member has been removed from the organization.',
            });
            utils.members.list.invalidate();
            utils.org.getBySlug.invalidate();
        },
        onError: (err) => {
            toast({
                title: 'Error',
                description: err.message,
                variant: 'destructive',
            });
        },
    });

    const resendInviteMutation = trpc.members.resendInvite.useMutation({
        onSuccess: () => {
            toast({
                title: 'Invitation resent',
                description: 'The invitation has been resent.',
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

    const cancelInviteMutation = trpc.members.cancelInvite.useMutation({
        onSuccess: () => {
            toast({
                title: 'Invitation cancelled',
                description: 'The invitation has been cancelled.',
            });
            utils.members.listInvitations.invalidate();
        },
        onError: (err) => {
            toast({
                title: 'Error',
                description: err.message,
                variant: 'destructive',
            });
        },
    });

    const handleInvite = () => {
        if (!org?.id || !inviteEmail) return;
        inviteMutation.mutate({
            orgId: org.id,
            email: inviteEmail,
            role: inviteRole,
        });
    };

    const handleUpdateRole = (memberId: string, userId: string, role: string) => {
        if (!org?.id) return;
        updateRoleMutation.mutate({
            orgId: org.id,
            userId,
            role: role as any,
        });
    };

    const handleRemoveMember = (memberId: string, userId: string) => {
        if (!org?.id) return;
        removeMemberMutation.mutate({
            orgId: org.id,
            userId,
        });
    };

    if (!org) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const currentUser = members?.find((m: any) => m.userId === org.createdBy);
    const isOwner = currentUser?.role === 'OWNER' || currentUser?.role === 'ADMIN';
    const memberCount = members?.length || 0;
    const pendingInvites = invitations?.length || 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Members</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage your organization members and their roles.
                    </p>
                </div>
                <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                    <DialogTrigger asChild>
                        <Button disabled={!isOwner}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Invite Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Invite to Organization</DialogTitle>
                            <DialogDescription>
                                Send an invitation to join {org.name}.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="colleague@example.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Role</Label>
                                <Select value={inviteRole} onValueChange={(v: any) => setInviteRole(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ADMIN">Admin</SelectItem>
                                        <SelectItem value="MEMBER">Member</SelectItem>
                                        <SelectItem value="VIEWER">Viewer</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    {ROLE_LABELS[inviteRole].description}
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleInvite}
                                disabled={inviteMutation.isPending || !inviteEmail}
                            >
                                {inviteMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Mail className="mr-2 h-4 w-4" />
                                )}
                                Send Invitation
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Separator />

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{memberCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingInvites}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Plan Limit</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {org.plan === 'FREE' ? '5' : '∞'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {org.plan === 'FREE' ? 'members' : 'unlimited'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Members List */}
            <Card>
                <CardHeader>
                    <CardTitle>Organization Members</CardTitle>
                    <CardDescription>
                        People who have access to this organization.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {members?.map((member: any) => {
                                const user = member.user;
                                const isCurrentUser = member.userId === org.createdBy;
                                const canModify = isOwner && !isCurrentUser;

                                return (
                                    <div
                                        key={member.id}
                                        className="flex items-center justify-between p-4 border rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={user.image || undefined} />
                                                <AvatarFallback>
                                                    {user.name?.[0] || user.email[0].toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{user.name || 'Unknown'}</p>
                                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary">{ROLE_LABELS[member.role]?.label || member.role}</Badge>
                                                {isCurrentUser && (
                                                    <Badge variant="outline">You</Badge>
                                                )}
                                            </div>
                                            {canModify && member.role !== 'OWNER' && (
                                                <div className="flex items-center gap-2">
                                                    <Select
                                                        value={member.role}
                                                        onValueChange={(v) => handleUpdateRole(member.id, member.userId, v)}
                                                    >
                                                        <SelectTrigger className="w-32">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {Object.entries(ROLE_LABELS)
                                                                .filter(([role]) => role !== 'OWNER')
                                                                .map(([role, { label }]) => (
                                                                    <SelectItem key={role} value={role}>
                                                                        {label}
                                                                    </SelectItem>
                                                                ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleRemoveMember(member.id, member.userId)}
                                                        disabled={removeMemberMutation.isPending}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Pending Invitations */}
            {pendingInvites > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Pending Invitations</CardTitle>
                        <CardDescription>
                            Invitations that have been sent but not yet accepted.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {invitations?.map((invite: any) => (
                                <div
                                    key={invite.id}
                                    className="flex items-center justify-between p-4 border rounded-lg bg-muted/50"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20">
                                            <Mail className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{invite.email}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {ROLE_LABELS[invite.role]?.label || invite.role} •{' '}
                                                Expires {formatDistanceToNow(new Date(invite.expiresAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => resendInviteMutation.mutate({ orgId: org.id, id: invite.id })}
                                            disabled={resendInviteMutation.isPending}
                                        >
                                            Resend
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => cancelInviteMutation.mutate({ orgId: org.id, id: invite.id })}
                                            disabled={cancelInviteMutation.isPending}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
