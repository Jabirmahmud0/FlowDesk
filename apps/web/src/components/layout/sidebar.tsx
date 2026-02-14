'use client';

import {
    BarChart3,
    Calendar,
    CheckSquare,
    ChevronDown,
    Files,
    FolderKanban,
    LayoutDashboard,
    MessageSquare,
    Settings,
    Users
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { UserNav } from '@/components/layout/user-nav';
import { OrgSwitcher } from '@/components/layout/org-switcher';
import { WorkspaceSwitcher } from '@/components/layout/workspace-switcher';

export function Sidebar({ className }: { className?: string }) {
    const pathname = usePathname();
    const params = useParams();
    const orgSlug = params?.orgSlug as string;
    const wsSlug = params?.wsSlug as string;

    const routes = [
        {
            label: 'Backlog',
            icon: CheckSquare,
            href: `/${orgSlug}/${wsSlug}/backlog`,
            active: pathname === `/${orgSlug}/${wsSlug}/backlog`,
            needsWorkspace: true,
        },
        {
            label: 'Board',
            icon: FolderKanban,
            href: `/${orgSlug}/${wsSlug}/board`,
            active: pathname === `/${orgSlug}/${wsSlug}/board`,
            needsWorkspace: true,
        },
        {
            label: 'Docs',
            icon: Files,
            href: `/${orgSlug}/${wsSlug}/docs`,
            active: pathname.startsWith(`/${orgSlug}/${wsSlug}/docs`),
            needsWorkspace: true,
        },
        {
            label: 'Activity',
            icon: BarChart3,
            href: `/${orgSlug}/${wsSlug}/activity`,
            active: pathname === `/${orgSlug}/${wsSlug}/activity`,
            needsWorkspace: true,
        },
    ];

    return (
        <div className={cn("flex h-full w-[280px] flex-col border-r bg-card/50 backdrop-blur-xl", className)}>
            <div className="flex flex-col border-b">
                <div className="h-14 flex items-center px-4">
                    <OrgSwitcher />
                </div>
                {orgSlug && (
                    <div className="px-4 pb-2">
                        <WorkspaceSwitcher />
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-auto py-2">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-2 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
                        Start
                    </h2>
                    <div className="space-y-1">
                        <Button
                            variant={pathname === `/${orgSlug}` ? "secondary" : "ghost"}
                            className="w-full justify-start"
                            asChild
                        >
                            <Link href={`/${orgSlug}`}>
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                Overview
                            </Link>
                        </Button>
                    </div>
                </div>

                {wsSlug && (
                    <div className="px-3 py-2">
                        <h2 className="mb-2 px-2 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
                            Workspace
                        </h2>
                        <div className="space-y-1">
                            {routes.filter(r => r.needsWorkspace).map((route) => (
                                <Button
                                    key={route.href}
                                    variant={route.active ? "secondary" : "ghost"}
                                    className="w-full justify-start"
                                    asChild
                                >
                                    <Link href={route.href}>
                                        <route.icon className="mr-2 h-4 w-4" />
                                        {route.label}
                                    </Link>
                                </Button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="px-3 py-2">
                    <h2 className="mb-2 px-2 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
                        Team
                    </h2>
                    <div className="space-y-1">
                        <Button variant="ghost" className="w-full justify-start" asChild>
                            <Link href={`/${orgSlug}/members`}>
                                <Users className="mr-2 h-4 w-4" />
                                Members
                            </Link>
                        </Button>
                        <Button variant="ghost" className="w-full justify-start" asChild>
                            <Link href={`/${orgSlug}/settings`}>
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="border-t p-4">
                <UserNav />
            </div>
        </div>
    );
}
