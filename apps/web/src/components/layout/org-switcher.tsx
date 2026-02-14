'use client';

import * as React from 'react';
import { ChevronsUpDown, Check, Plus } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { trpc } from '@/lib/trpc';
import { useRouter, usePathname } from 'next/navigation';

export function OrgSwitcher({ className }: { className?: string }) {
    const router = useRouter();
    const pathname = usePathname();
    // Get current org slug from URL
    const currentOrgSlug = pathname?.split('/')[1];

    const { data: orgs } = trpc.org.list.useQuery();
    const { data: currentOrg } = trpc.org.getBySlug.useQuery(
        { slug: currentOrgSlug as string },
        { enabled: !!currentOrgSlug }
    );

    const [open, setOpen] = React.useState(false);

    const handleOrgChange = (slug: string) => {
        router.push(`/${slug}`);
        setOpen(false);
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    aria-label="Select a team"
                    className={cn("w-[200px] justify-between", className)}
                >
                    <Avatar className="mr-2 h-5 w-5">
                        <AvatarImage
                            src={`https://avatar.vercel.sh/${currentOrg?.slug}.png`}
                            alt={currentOrg?.slug}
                        />
                        <AvatarFallback>
                            {currentOrg?.name?.[0]?.toUpperCase() ?? "Org"}
                        </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{currentOrg?.name ?? "Select Organization"}</span>
                    <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px]">
                <DropdownMenuLabel>Organizations</DropdownMenuLabel>
                <DropdownMenuGroup>
                    {orgs?.map((org) => (
                        <DropdownMenuItem
                            key={org.id}
                            onClick={() => handleOrgChange(org.slug)}
                            className="text-sm"
                        >
                            <Avatar className="mr-2 h-5 w-5">
                                <AvatarImage
                                    src={`https://avatar.vercel.sh/${org.slug}.png`}
                                    alt={org.slug}
                                />
                                <AvatarFallback>{org.name[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            {org.name}
                            <Check
                                className={cn(
                                    "ml-auto h-4 w-4",
                                    currentOrg?.id === org.id ? "opacity-100" : "opacity-0"
                                )}
                            />
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => router.push('/create-org')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Organization
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
