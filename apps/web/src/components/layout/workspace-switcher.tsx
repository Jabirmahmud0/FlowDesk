'use client';

import * as React from 'react';
import { ChevronsUpDown, Check, Plus, Box } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { trpc } from '@/lib/trpc';
import { useRouter } from 'next/navigation';
import { useOrg } from '@/hooks/use-org';
import { useWorkspace } from '@/hooks/use-workspace';

export function WorkspaceSwitcher({ className }: { className?: string }) {
    const router = useRouter();
    const { org, slug: orgSlug } = useOrg();
    const { workspace: currentWorkspace, wsSlug } = useWorkspace();

    const { data: workspaces } = trpc.workspace.list.useQuery(
        { orgId: org?.id! },
        { enabled: !!org?.id }
    );

    const [open, setOpen] = React.useState(false);

    const handleWorkspaceChange = (slug: string) => {
        router.push(`/${orgSlug}/${slug}`);
        setOpen(false);
    };

    if (!org) return null;

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    role="combobox"
                    aria-expanded={open}
                    aria-label="Select a workspace"
                    className={cn("w-full justify-between px-2", className)}
                >
                    <div className="flex items-center gap-2 truncate">
                        <Avatar className="h-5 w-5 rounded-md">
                            <AvatarFallback className="rounded-md bg-primary/20 text-primary text-[10px]">
                                {currentWorkspace?.name?.[0]?.toUpperCase() ?? <Box className="w-3 h-3" />}
                            </AvatarFallback>
                        </Avatar>
                        <span className="truncate text-sm font-medium">
                            {currentWorkspace?.name ?? "Select Workspace"}
                        </span>
                    </div>
                    <ChevronsUpDown className="ml-auto h-3 w-3 shrink-0 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px]">
                <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
                <DropdownMenuGroup>
                    {workspaces?.map((ws) => (
                        <DropdownMenuItem
                            key={ws.id}
                            onClick={() => handleWorkspaceChange(ws.slug)}
                            className="text-sm"
                        >
                            <Avatar className="mr-2 h-5 w-5 rounded-md">
                                <AvatarFallback className="rounded-md bg-primary/20 text-[10px]">
                                    {ws.name[0].toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            {ws.name}
                            <Check
                                className={cn(
                                    "ml-auto h-4 w-4",
                                    currentWorkspace?.id === ws.id ? "opacity-100" : "opacity-0"
                                )}
                            />
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => router.push(`/${orgSlug}/create-workspace`)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Workspace
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
