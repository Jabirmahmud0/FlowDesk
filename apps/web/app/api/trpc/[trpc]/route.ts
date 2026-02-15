import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@flowdesk/trpc';
import { createContext } from '@/lib/trpc-context';

const handler = (req: Request) => {
  // Force rebuild
  console.log('[TRPC] Request to ' + req.url);
  console.log('[TRPC] DATABASE_URL present:', !!process.env.DATABASE_URL);

  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
    onError: ({ path, error }) => {
      console.error('[TRPC] Error on ' + path + ': ' + error.message);
      console.error(error);
    },
  });
};

export { handler as GET, handler as POST };
