import { Sidebar } from '@/components/layout/sidebar';
import { NotificationPopover } from '@/components/layout/notification-popover';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function TenantLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: { orgSlug: string };
}) {
    const session = await auth();

    if (!session) {
        redirect('/auth/login');
    }

    // TODO: Add server-side check for org existence/membership to prevent 404s/Auth errors on client first load if possible
    // For now, client-side hooks handle the granular data, but we protect the route.

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 bg-background">
                <header className="h-14 border-b px-4 flex items-center justify-end gap-2 bg-card/50 backdrop-blur-sm">
                    <NotificationPopover />
                </header>
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
