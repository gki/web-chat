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

describe('User Resolvers Integration Tests', () => {
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

  describe('createUser mutation', () => {
    it('should create a new user with valid data', async () => {
      const mutation = {
        query: `
          mutation CreateUser($name: String!) {
            createUser(name: $name) {
              id
              name
              createdAt
              lastSeen
            }
          }
        `,
        variables: {
          name: 'Test User'
        }
      };

      const response = await request(app)
        .post('/graphql')
        .send(mutation)
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.createUser).toBeDefined();
      expect(response.body.data.createUser.name).toBe('Test User');
      expect(response.body.data.createUser.id).toBeTruthy();

      // Verify user was actually saved to database
      const savedUser = await prisma.user.findUnique({
        where: { id: response.body.data.createUser.id }
      });
      expect(savedUser).toBeTruthy();
      expect(savedUser?.name).toBe('Test User');
    });

    it('should fail when creating user with empty name', async () => {
      const mutation = {
        query: `
          mutation CreateUser($name: String!) {
            createUser(name: $name) {
              id
              name
            }
          }
        `,
        variables: {
          name: ''
        }
      };

      const response = await request(app)
        .post('/graphql')
        .send(mutation)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Name is required and must be a string');
      expect(response.body.data?.createUser || null).toBeNull();

      // Verify no user was created in database
      const userCount = await prisma.user.count();
      expect(userCount).toBe(0);
    });

    it('should trim whitespace from user name', async () => {
      const mutation = {
        query: `
          mutation CreateUser($name: String!) {
            createUser(name: $name) {
              id
              name
            }
          }
        `,
        variables: {
          name: '  Alice  '
        }
      };

      const response = await request(app)
        .post('/graphql')
        .send(mutation)
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.createUser.name).toBe('Alice');
    });
  });

  describe('users query', () => {
    it('should return all users ordered by lastSeen desc', async () => {
      // Create test users directly in database with specific lastSeen times
      const user1 = await prisma.user.create({
        data: { 
          name: 'User 1', 
          lastSeen: new Date('2023-01-01T10:00:00Z') 
        }
      });
      
      const user2 = await prisma.user.create({
        data: { 
          name: 'User 2', 
          lastSeen: new Date('2023-01-01T11:00:00Z') 
        }
      });

      const query = {
        query: `
          query GetUsers {
            users {
              id
              name
              lastSeen
            }
          }
        `
      };

      const response = await request(app)
        .post('/graphql')
        .send(query)
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.users).toHaveLength(2);
      
      // Should be ordered by lastSeen desc (most recent first)
      expect(response.body.data.users[0].name).toBe('User 2');
      expect(response.body.data.users[1].name).toBe('User 1');
    });

    it('should return empty array when no users exist', async () => {
      const query = {
        query: `
          query GetUsers {
            users {
              id
              name
            }
          }
        `
      };

      const response = await request(app)
        .post('/graphql')
        .send(query)
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.users).toEqual([]);
    });
  });

  describe('user query', () => {
    it('should return specific user by id', async () => {
      const user = await prisma.user.create({
        data: { name: 'Specific User' }
      });

      const query = {
        query: `
          query GetUser($id: ID!) {
            user(id: $id) {
              id
              name
              messages {
                id
              }
            }
          }
        `,
        variables: {
          id: user.id
        }
      };

      const response = await request(app)
        .post('/graphql')
        .send(query)
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.id).toBe(user.id);
      expect(response.body.data.user.name).toBe('Specific User');
      expect(response.body.data.user.messages).toEqual([]);
    });

    it('should return null for non-existent user', async () => {
      const query = {
        query: `
          query GetUser($id: ID!) {
            user(id: $id) {
              id
              name
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
  });

  describe('updateUserLastSeen mutation', () => {
    it('should update user lastSeen timestamp', async () => {
      const user = await prisma.user.create({
        data: { 
          name: 'Test User',
          lastSeen: new Date('2023-01-01T10:00:00Z')
        }
      });

      const beforeUpdate = new Date();

      const mutation = {
        query: `
          mutation UpdateUserLastSeen($id: ID!) {
            updateUserLastSeen(id: $id) {
              id
              name
              lastSeen
            }
          }
        `,
        variables: {
          id: user.id
        }
      };

      const response = await request(app)
        .post('/graphql')
        .send(mutation)
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.updateUserLastSeen.id).toBe(user.id);
      
      const updatedLastSeen = new Date(response.body.data.updateUserLastSeen.lastSeen);
      expect(updatedLastSeen.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());

      // Verify database was actually updated
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id }
      });
      expect(updatedUser?.lastSeen.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
    });

    it('should fail for non-existent user', async () => {
      const mutation = {
        query: `
          mutation UpdateUserLastSeen($id: ID!) {
            updateUserLastSeen(id: $id) {
              id
            }
          }
        `,
        variables: {
          id: 'non-existent-id'
        }
      };

      const response = await request(app)
        .post('/graphql')
        .send(mutation)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      // When there's an error, data field might be null or undefined
      expect(response.body.data?.updateUserLastSeen || null).toBeNull();
    });
  });
});