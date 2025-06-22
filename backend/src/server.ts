import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { createServer } from 'http';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { execute, subscribe } from 'graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { GraphQLContext } from './types/context';

import { typeDefs } from './schema/typeDefs';
import { resolvers } from './resolvers';

dotenv.config();

export const prisma = new PrismaClient();

export async function startServer() {
  const app = express();
  
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  const server = new ApolloServer({
    schema,
    context: ({ req }): GraphQLContext => ({
      prisma,
    }),
    plugins: [
      {
        serverWillStart() {
          return {
            drainServer() {
              subscriptionServer.close();
            },
          };
        },
      },
    ],
  });

  await server.start();
  server.applyMiddleware({ app, path: process.env.GRAPHQL_ENDPOINT || '/graphql' });

  const httpServer = createServer(app);
  
  const subscriptionServer = SubscriptionServer.create(
    {
      schema,
      execute,
      subscribe,
      onConnect: () => {
        console.log('Client connected for subscriptions');
        return { prisma };
      },
      onDisconnect: () => {
        console.log('Client disconnected from subscriptions');
      },
    },
    {
      server: httpServer,
      path: server.graphqlPath,
    }
  );

  const PORT = process.env.PORT || 4000;
  
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`🚀 Subscriptions ready at ws://localhost:${PORT}${server.graphqlPath}`);
  });

  return { server, app, httpServer };
}

// Start server if this file is run directly
if (require.main === module) {
  startServer().catch(error => {
    console.error('Error starting server:', error);
    process.exit(1);
  });
}