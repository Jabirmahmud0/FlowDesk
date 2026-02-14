import { Sidebar } from '@/components/layout/sidebar';
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
            <main className="flex-1 overflow-y-auto bg-background">
                {children}
            </main>
        </div>
    );
}
