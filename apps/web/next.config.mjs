/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['@flowdesk/db', '@flowdesk/trpc', '@flowdesk/types'],
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'res.cloudinary.com' },
            { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
            { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
        ],
    },
};

export default nextConfig;
