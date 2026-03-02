/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['@flowdesk/db', '@flowdesk/trpc', '@flowdesk/types', '@flowdesk/graphql'],
    output: 'standalone',
    outputFileTracingRoot: '../../',
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'res.cloudinary.com' },
            { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
            { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
        ],
    },
    // Production optimizations
    poweredByHeader: false,
    compress: true,
    // Skip ESLint during production builds (run separately in CI)
    eslint: {
        ignoreDuringBuilds: true,
    },
};

export default nextConfig;
