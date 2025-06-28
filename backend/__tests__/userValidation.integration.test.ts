import request from 'supertest';
import express, { Application } from 'express';
import { ApolloServer } from 'apollo-server-express';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

import { typeDefs } from '../src/schema/typeDefs';
import { resolvers } from '../src/resolvers';

describe('User Validation Integration Tests', () => {
  let app: any;
  let server: ApolloServer;
  let prisma: PrismaClient;
  let testDbPath: string;

  beforeEach(async () => {
    // Create unique database for this test
    testDbPath = path.join(__dirname, `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.db`);
    
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: `file:${testDbPath}`,
        },
      },
    });

    // Initialize database schema
    execSync('npx prisma db push', {
      env: { ...process.env, DATABASE_URL: `file:${testDbPath}` },
      stdio: 'pipe',
    });

    const schema = makeExecutableSchema({
      typeDefs,
      resolvers,
    });

    server = new ApolloServer({
      schema,
      context: () => ({
        prisma: prisma,
      }),
    });

    app = express();
    await server.start();
    server.applyMiddleware({ app, path: '/graphql' });
  });

  afterEach(async () => {
    await server.stop();
    await prisma.$disconnect();
    
    // Clean up test database file
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('user query by ID', () => {
    it('should return user when valid ID is provided', async () => {
      // Create a test user first
      const testUser = await prisma.user.create({
        data: { name: 'Test User' }
      });

      const query = {
        query: `
          query GetUserById($id: ID!) {
            user(id: $id) {
              id
              name
              createdAt
              lastSeen
            }
          }
        `,
        variables: {
          id: testUser.id
        }
      };

      const response = await request(app)
        .post('/graphql')
        .send(query)
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.user).toBeTruthy();
      expect(response.body.data.user.id).toBe(testUser.id);
      expect(response.body.data.user.name).toBe('Test User');
      expect(response.body.data.user.createdAt).toBeTruthy();
      expect(response.body.data.user.lastSeen).toBeTruthy();
    });

    it('should return null when user with given ID does not exist', async () => {
      const query = {
        query: `
          query GetUserById($id: ID!) {
            user(id: $id) {
              id
              name
              createdAt
              lastSeen
            }
          }
        `,
        variables: {
          id: 'non-existent-id'
        }
      };

      const response = await request(app)
        .post('/graphql')
        .send(query)
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.user).toBeNull();
    });

    it('should validate that user still exists and has up-to-date lastSeen', async () => {
      // Create a test user
      const testUser = await prisma.user.create({
        data: { 
          name: 'Test User',
          lastSeen: new Date('2023-01-01T10:00:00Z') 
        }
      });

      // First query to get the user
      const getUserQuery = {
        query: `
          query GetUserById($id: ID!) {
            user(id: $id) {
              id
              name
              lastSeen
            }
          }
        `,
        variables: {
          id: testUser.id
        }
      };

      const getUserResponse = await request(app)
        .post('/graphql')
        .send(getUserQuery)
        .expect(200);

      expect(getUserResponse.body.data.user).toBeTruthy();
      
      // Update lastSeen
      const updateMutation = {
        query: `
          mutation UpdateUserLastSeen($id: ID!) {
            updateUserLastSeen(id: $id) {
              id
              lastSeen
            }
          }
        `,
        variables: {
          id: testUser.id
        }
      };

      const updateResponse = await request(app)
        .post('/graphql')
        .send(updateMutation)
        .expect(200);

      expect(updateResponse.body.errors).toBeUndefined();
      expect(updateResponse.body.data.updateUserLastSeen).toBeTruthy();
      
      // Verify the lastSeen was updated
      const newLastSeen = new Date(updateResponse.body.data.updateUserLastSeen.lastSeen);
      const originalLastSeen = new Date('2023-01-01T10:00:00Z');
      expect(newLastSeen.getTime()).toBeGreaterThan(originalLastSeen.getTime());
    });

    it('should handle invalid user ID for updateUserLastSeen', async () => {
      const updateMutation = {
        query: `
          mutation UpdateUserLastSeen($id: ID!) {
            updateUserLastSeen(id: $id) {
              id
              lastSeen
            }
          }
        `,
        variables: {
          id: 'invalid-user-id'
        }
      };

      const response = await request(app)
        .post('/graphql')
        .send(updateMutation)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.data?.updateUserLastSeen || null).toBeNull();
    });

    it('should include user messages when querying by ID', async () => {
      // Create a test user
      const testUser = await prisma.user.create({
        data: { name: 'Test User' }
      });

      // Create some messages for the user
      await prisma.message.createMany({
        data: [
          { content: 'Message 1', userId: testUser.id },
          { content: 'Message 2', userId: testUser.id }
        ]
      });

      const query = {
        query: `
          query GetUserById($id: ID!) {
            user(id: $id) {
              id
              name
              messages {
                id
                content
              }
            }
          }
        `,
        variables: {
          id: testUser.id
        }
      };

      const response = await request(app)
        .post('/graphql')
        .send(query)
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.user).toBeTruthy();
      expect(response.body.data.user.messages).toHaveLength(2);
      expect(response.body.data.user.messages[0].content).toBe('Message 1');
      expect(response.body.data.user.messages[1].content).toBe('Message 2');
    });
  });
});