import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import LandingPage from './(marketing)/page';

// Root page: redirect authenticated users to dashboard,
// otherwise render the marketing landing page
export default async function RootPage() {
    const session = await auth();
    if (session) {
        redirect('/dashboard');
    }
    return <LandingPage />;
}
