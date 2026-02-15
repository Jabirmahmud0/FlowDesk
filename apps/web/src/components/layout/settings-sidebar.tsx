'use client';

import { cn } from '@/lib/utils';
import { CreditCard, Settings, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useOrg } from '@/hooks/use-org';

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> { }

export function SettingsSidebar({ className, ...props }: SidebarNavProps) {
    const pathname = usePathname();
    const { slug } = useOrg();

    const items = [
        {
            title: "General",
            href: `/${slug}/settings`,
            icon: Settings
        },
        {
            title: "Members",
            href: `/${slug}/settings/members`,
            icon: Users
        },
        {
            title: "Billing",
            href: `/${slug}/settings/billing`,
            icon: CreditCard
        },
    ];

    return (
        <nav
            className={cn(
                "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1",
                className
            )}
            {...props}
        >
            {items.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        "justify-start flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                        pathname === item.href
                            ? "bg-accent text-accent-foreground"
                            : "transparent"
                    )}
                >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                </Link>
            ))}
        </nav>
    );
}
