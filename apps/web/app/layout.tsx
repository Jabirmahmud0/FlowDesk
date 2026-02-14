import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { TRPCProvider } from '@/components/providers/trpc-provider';
import './globals.css';

export const metadata: Metadata = {
    title: 'FlowDesk — Project Management for Modern Teams',
    description:
        'A multi-tenant B2B SaaS platform combining Linear-style project tracking with Notion-style docs. Kanban boards, real-time collaboration, and subscription billing.',
    keywords: ['project management', 'kanban', 'team collaboration', 'saas'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="min-h-screen antialiased">
                <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
                    <TRPCProvider>{children}</TRPCProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
