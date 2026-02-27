'use client';

import { trpc } from '@/lib/trpc';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Shield, Trash, UserX } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { OrgRole } from '@flowdesk/types';

interface MemberListProps {
    orgId: string;
    currentUserId: string;
}

export function MemberList({ orgId, currentUserId }: MemberListProps) {
    const { data: members, isLoading } = trpc.members.list.useQuery({ orgId });
    const { toast } = useToast();
    const utils = trpc.useUtils();

    const updateRoleMutation = trpc.members.updateRole.useMutation({
        onSuccess: () => {
            toast({ title: 'Role updated' });
            utils.members.list.invalidate();
        },
        onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
    });

    const removeMemberMutation = trpc.members.remove.useMutation({
        onSuccess: () => {
            toast({ title: 'Member removed' });
            utils.members.list.invalidate();
        },
        onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
    });

    if (isLoading) {
        return <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg animate-pulse">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-muted" />
                        <div className="space-y-2">
                            <div className="h-4 w-32 bg-muted rounded" />
                            <div className="h-3 w-48 bg-muted rounded" />
                        </div>
                    </div>
                </div>
            ))}
        </div>;
    }

    const handleRoleChange = (userId: string, newRole: string) => {
        updateRoleMutation.mutate({
            orgId,
            userId,
            role: newRole as 'ADMIN' | 'MEMBER' | 'VIEWER',
        });
    };

    const handleRemoveMember = (userId: string) => {
        if (confirm('Are you sure you want to remove this member?')) {
            removeMemberMutation.mutate({ orgId, userId });
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">Members ({members?.length || 0})</h2>
            <div className="rounded-md border">
                {members?.map((member) => (
                    <div
                        key={member.userId}
                        className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-muted/50 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <Avatar>
                                <AvatarImage src={member.user?.image || undefined} />
                                <AvatarFallback>{member.user?.name?.[0] || '?'}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium">{member.user?.name || 'Unknown User'}</p>
                                <p className="text-sm text-muted-foreground">{member.user?.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <Badge variant={member.role === 'OWNER' ? 'default' : 'secondary'}>
                                {member.role}
                            </Badge>

                            {/* Actions menu - only show if not self (can't remove self here usually) and generally for admins/owners */}
                            {/* For simplicity we show it, backend will authorize. Ideally check permissions on frontend too. */}
                            {member.userId !== currentUserId && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuSeparator />

                                        <DropdownMenuSub>
                                            <DropdownMenuSubTrigger>
                                                <Shield className="mr-2 h-4 w-4" />
                                                Change Role
                                            </DropdownMenuSubTrigger>
                                            <DropdownMenuSubContent>
                                                <DropdownMenuRadioGroup
                                                    value={member.role}
                                                    onValueChange={(val) => handleRoleChange(member.userId, val)}
                                                >
                                                    <DropdownMenuRadioItem value="ADMIN">Admin</DropdownMenuRadioItem>
                                                    <DropdownMenuRadioItem value="MEMBER">Member</DropdownMenuRadioItem>
                                                    <DropdownMenuRadioItem value="VIEWER">Viewer</DropdownMenuRadioItem>
                                                </DropdownMenuRadioGroup>
                                            </DropdownMenuSubContent>
                                        </DropdownMenuSub>

                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="text-red-600"
                                            onClick={() => handleRemoveMember(member.userId)}
                                        >
                                            <UserX className="mr-2 h-4 w-4" />
                                            Remove Member
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
