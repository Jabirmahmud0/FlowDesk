'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { inviteMemberSchema } from '@flowdesk/types';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Plus } from 'lucide-react';
import { z } from 'zod';

// We need to omit orgId from the form schema because it comes from props/context
const formSchema = inviteMemberSchema.omit({ orgId: true });
type FormData = z.infer<typeof formSchema>;

interface InviteMemberDialogProps {
    orgId: string;
}

export function InviteMemberDialog({ orgId }: InviteMemberDialogProps) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const utils = trpc.useUtils();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            role: 'MEMBER',
            email: '',
        },
    });

    const inviteMutation = trpc.members.invite.useMutation({
        onSuccess: () => {
            toast({
                title: 'Invitation sent',
                description: 'The user has been invited to the organization.',
            });
            setOpen(false);
            form.reset();
            utils.members.list.invalidate(); // Refresh list
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    const onSubmit = (data: FormData) => {
        inviteMutation.mutate({
            ...data,
            orgId,
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Invite Member
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Invite Member</DialogTitle>
                    <DialogDescription>
                        Invite a new member to your organization. They will receive an email to join.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                            Email
                        </Label>
                        <Input
                            id="email"
                            placeholder="colleague@example.com"
                            className="col-span-3"
                            {...form.register('email')}
                        />
                    </div>
                    {form.formState.errors.email && (
                        <p className="text-red-500 text-xs ml-[25%]">{form.formState.errors.email.message}</p>
                    )}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">
                            Role
                        </Label>
                        <Select
                            defaultValue="MEMBER"
                            onValueChange={(val) => form.setValue('role', val as any)}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                                <SelectItem value="MEMBER">Member</SelectItem>
                                <SelectItem value="VIEWER">Viewer</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={inviteMutation.isPending}>
                            {inviteMutation.isPending ? 'Inviting...' : 'Send Invitation'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
