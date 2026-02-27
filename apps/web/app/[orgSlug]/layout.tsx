import { Sidebar } from '@/components/layout/sidebar';
import { NotificationPopover } from '@/components/layout/notification-popover';
import { CommandPalette } from '@/components/layout/command-palette';
import { PageTransition } from '@/components/animations/page-transition';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function TenantLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ orgSlug: string }>;
}) {
    const session = await auth();

    if (!session) {
        redirect('/auth/login');
    }

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 bg-background">
                <header className="h-14 border-b px-4 flex items-center justify-between gap-2 bg-card/50 backdrop-blur-sm">
                    <CommandPalette />
                    <NotificationPopover />
                </header>
                <main className="flex-1 overflow-y-auto">
                    <PageTransition>
                        {children}
                    </PageTransition>
                </main>
            </div>
        </div>
    );
}

