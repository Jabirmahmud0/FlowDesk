import { ApolloServer } from '@apollo/server';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';

export interface GraphQLContext {
    userId?: string | null;
    orgId?: string | null;
    wsId?: string | null;
}

export async function createApolloServer() {
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

    await server.start();

    return server;
}

export { typeDefs, resolvers };
