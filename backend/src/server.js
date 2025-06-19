const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { createServer } = require('http');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const { execute, subscribe } = require('graphql');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const typeDefs = require('./schema/typeDefs');
const resolvers = require('./resolvers');

const prisma = new PrismaClient();

async function startServer() {
  const app = express();
  
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  const server = new ApolloServer({
    schema,
    context: ({ req }) => ({
      prisma,
      req,
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
      onConnect: (connectionParams, webSocket, context) => {
        console.log('Client connected for subscriptions');
        return { prisma };
      },
      onDisconnect: (webSocket, context) => {
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

module.exports = { startServer, prisma };