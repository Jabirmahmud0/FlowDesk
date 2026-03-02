import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { ApolloServer } from '@apollo/server';
import { typeDefs, resolvers, type GraphQLContext } from '@flowdesk/graphql';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const server = new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
    formatError: (error) => {
        console.error('[GraphQL Error]', error);
        return {
            message: error.message,
            code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
        };
    },
});

const handler = startServerAndCreateNextHandler(server, {
    context: async (req) => {
        const session = await getServerSession(authOptions);
        
        return {
            userId: session?.user?.id ?? null,
            orgId: req.headers.get('x-org-id') ?? null,
            wsId: req.headers.get('x-ws-id') ?? null,
        };
    },
});

export async function GET(request: Request) {
    return handler(request);
}

export async function POST(request: Request) {
    return handler(request);
}
