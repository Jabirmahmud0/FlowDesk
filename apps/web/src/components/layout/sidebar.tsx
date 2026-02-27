'use client';

import {
    BarChart3,
    Calendar,
    CheckSquare,
    ChevronLeft,
    ChevronRight,
    Files,
    FolderKanban,
    LayoutDashboard,
    Settings,
    Users
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { UserNav } from '@/components/layout/user-nav';
import { OrgSwitcher } from '@/components/layout/org-switcher';
import { WorkspaceSwitcher } from '@/components/layout/workspace-switcher';

const sidebarVariants = {
    expanded: { width: 280 },
    collapsed: { width: 64 },
};

const contentVariants = {
    expanded: { opacity: 1, x: 0 },
    collapsed: { opacity: 0, x: -10 },
};

export function Sidebar({ className }: { className?: string }) {
    const pathname = usePathname();
    const params = useParams();
    const orgSlug = params?.orgSlug as string;
    const wsSlug = params?.wsSlug as string;
    const [collapsed, setCollapsed] = useState(false);

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
            label: 'Calendar',
            icon: Calendar,
            href: `/${orgSlug}/${wsSlug}/calendar`,
            active: pathname === `/${orgSlug}/${wsSlug}/calendar`,
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

    const teamRoutes = [
        {
            label: 'Members',
            icon: Users,
            href: `/${orgSlug}/members`,
            active: pathname === `/${orgSlug}/members`,
        },
        {
            label: 'Analytics',
            icon: BarChart3,
            href: `/${orgSlug}/analytics`,
            active: pathname === `/${orgSlug}/analytics`,
        },
        {
            label: 'Settings',
            icon: Settings,
            href: `/${orgSlug}/settings`,
            active: pathname === `/${orgSlug}/settings`,
        },
    ];

    return (
        <motion.div
            className={cn(
                'flex h-full flex-col border-r bg-card/50 backdrop-blur-xl overflow-hidden',
                className
            )}
            variants={sidebarVariants}
            animate={collapsed ? 'collapsed' : 'expanded'}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
            {/* Header */}
            <div className="flex flex-col border-b">
                <div className="h-14 flex items-center px-4 justify-between">
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.div
                                variants={contentVariants}
                                initial="collapsed"
                                animate="expanded"
                                exit="collapsed"
                                transition={{ duration: 0.15 }}
                                className="flex-1 min-w-0"
                            >
                                <OrgSwitcher />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={() => setCollapsed(!collapsed)}
                    >
                        {collapsed ? (
                            <ChevronRight className="h-4 w-4" />
                        ) : (
                            <ChevronLeft className="h-4 w-4" />
                        )}
                    </Button>
                </div>
                {orgSlug && !collapsed && (
                    <motion.div
                        variants={contentVariants}
                        initial="collapsed"
                        animate="expanded"
                        exit="collapsed"
                        className="px-4 pb-2"
                    >
                        <WorkspaceSwitcher />
                    </motion.div>
                )}
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-auto py-2">
                {/* Overview */}
                <div className="px-3 py-2">
                    {!collapsed && (
                        <h2 className="mb-2 px-2 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
                            Start
                        </h2>
                    )}
                    <div className="space-y-1">
                        <Button
                            variant={pathname === `/${orgSlug}` ? 'secondary' : 'ghost'}
                            className={cn('w-full', collapsed ? 'justify-center px-0' : 'justify-start')}
                            asChild
                            title="Overview"
                        >
                            <Link href={`/${orgSlug}`}>
                                <LayoutDashboard className={cn('h-4 w-4', !collapsed && 'mr-2')} />
                                {!collapsed && 'Overview'}
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Workspace routes */}
                {wsSlug && (
                    <div className="px-3 py-2">
                        {!collapsed && (
                            <h2 className="mb-2 px-2 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
                                Workspace
                            </h2>
                        )}
                        <div className="space-y-1">
                            {routes.filter((r) => r.needsWorkspace).map((route) => (
                                <Button
                                    key={route.href}
                                    variant={route.active ? 'secondary' : 'ghost'}
                                    className={cn('w-full', collapsed ? 'justify-center px-0' : 'justify-start')}
                                    asChild
                                    title={route.label}
                                >
                                    <Link href={route.href}>
                                        <route.icon className={cn('h-4 w-4', !collapsed && 'mr-2')} />
                                        {!collapsed && route.label}
                                    </Link>
                                </Button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Team routes */}
                <div className="px-3 py-2">
                    {!collapsed && (
                        <h2 className="mb-2 px-2 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
                            Team
                        </h2>
                    )}
                    <div className="space-y-1">
                        {teamRoutes.map((route) => (
                            <Button
                                key={route.href}
                                variant={route.active ? 'secondary' : 'ghost'}
                                className={cn('w-full', collapsed ? 'justify-center px-0' : 'justify-start')}
                                asChild
                                title={route.label}
                            >
                                <Link href={route.href}>
                                    <route.icon className={cn('h-4 w-4', !collapsed && 'mr-2')} />
                                    {!collapsed && route.label}
                                </Link>
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="border-t p-4">
                {collapsed ? (
                    <div className="flex justify-center">
                        <UserNav collapsed />
                    </div>
                ) : (
                    <UserNav />
                )}
            </div>
        </motion.div>
    );
}
