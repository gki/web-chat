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

describe('E2E Chat Flow Integration Tests', () => {
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

  describe('Complete Chat Flow', () => {
    it('should handle full chat workflow: create users, exchange messages, and verify relationships', async () => {
      // Step 1: Create first user (Alice)
      const createUser1Response = await request(app)
        .post('/graphql')
        .send({
          query: `
            mutation {
              createUser(name: "Alice") {
                id
                name
                createdAt
                lastSeen
              }
            }
          `
        })
        .expect(200);

      expect(createUser1Response.body.errors).toBeUndefined();
      const alice = createUser1Response.body.data.createUser;
      expect(alice.name).toBe('Alice');
      expect(alice.id).toBeTruthy();

      // Step 2: Create second user (Bob)
      const createUser2Response = await request(app)
        .post('/graphql')
        .send({
          query: `
            mutation {
              createUser(name: "Bob") {
                id
                name
                createdAt
                lastSeen
              }
            }
          `
        })
        .expect(200);

      expect(createUser2Response.body.errors).toBeUndefined();
      const bob = createUser2Response.body.data.createUser;
      expect(bob.name).toBe('Bob');
      expect(bob.id).toBeTruthy();

      // Step 3: Verify both users exist in system
      const getUsersResponse = await request(app)
        .post('/graphql')
        .send({
          query: `
            query {
              users {
                id
                name
                lastSeen
                messages {
                  id
                }
              }
            }
          `
        })
        .expect(200);

      expect(getUsersResponse.body.errors).toBeUndefined();
      const users = getUsersResponse.body.data.users;
      expect(users).toHaveLength(2);
      
      const userNames = users.map((u: any) => u.name).sort();
      expect(userNames).toEqual(['Alice', 'Bob']);
      
      // Both users should have no messages initially
      users.forEach((user: any) => {
        expect(user.messages).toEqual([]);
      });

      // Step 4: Alice sends first message
      const aliceMessageResponse = await request(app)
        .post('/graphql')
        .send({
          query: `
            mutation {
              createMessage(content: "Hello Bob! How are you?", userId: "${alice.id}") {
                id
                content
                createdAt
                user {
                  id
                  name
                }
              }
            }
          `
        })
        .expect(200);

      expect(aliceMessageResponse.body.errors).toBeUndefined();
      const aliceMessage = aliceMessageResponse.body.data.createMessage;
      expect(aliceMessage.content).toBe('Hello Bob! How are you?');
      expect(aliceMessage.user.name).toBe('Alice');

      // Step 5: Bob replies to Alice
      const bobMessageResponse = await request(app)
        .post('/graphql')
        .send({
          query: `
            mutation {
              createMessage(content: "Hi Alice! I'm doing great, thanks for asking!", userId: "${bob.id}") {
                id
                content
                createdAt
                user {
                  id
                  name
                }
              }
            }
          `
        })
        .expect(200);

      expect(bobMessageResponse.body.errors).toBeUndefined();
      const bobMessage = bobMessageResponse.body.data.createMessage;
      expect(bobMessage.content).toBe("Hi Alice! I'm doing great, thanks for asking!");
      expect(bobMessage.user.name).toBe('Bob');

      // Step 6: Alice sends follow-up message
      const aliceFollowupResponse = await request(app)
        .post('/graphql')
        .send({
          query: `
            mutation {
              createMessage(content: "That's wonderful to hear!", userId: "${alice.id}") {
                id
                content
                user {
                  name
                }
              }
            }
          `
        })
        .expect(200);

      expect(aliceFollowupResponse.body.errors).toBeUndefined();
      expect(aliceFollowupResponse.body.data.createMessage.content).toBe("That's wonderful to hear!");

      // Step 7: Retrieve all messages and verify conversation flow
      const getAllMessagesResponse = await request(app)
        .post('/graphql')
        .send({
          query: `
            query {
              messages {
                id
                content
                createdAt
                user {
                  id
                  name
                }
              }
            }
          `
        })
        .expect(200);

      expect(getAllMessagesResponse.body.errors).toBeUndefined();
      const allMessages = getAllMessagesResponse.body.data.messages;
      expect(allMessages).toHaveLength(3);

      // Verify message order (should be chronological)
      expect(allMessages[0].content).toBe('Hello Bob! How are you?');
      expect(allMessages[0].user.name).toBe('Alice');
      
      expect(allMessages[1].content).toBe("Hi Alice! I'm doing great, thanks for asking!");
      expect(allMessages[1].user.name).toBe('Bob');
      
      expect(allMessages[2].content).toBe("That's wonderful to hear!");
      expect(allMessages[2].user.name).toBe('Alice');

      // Step 8: Verify individual user message relationships
      const getAliceWithMessagesResponse = await request(app)
        .post('/graphql')
        .send({
          query: `
            query {
              user(id: "${alice.id}") {
                id
                name
                messages {
                  id
                  content
                }
              }
            }
          `
        })
        .expect(200);

      expect(getAliceWithMessagesResponse.body.errors).toBeUndefined();
      const aliceWithMessages = getAliceWithMessagesResponse.body.data.user;
      expect(aliceWithMessages.messages).toHaveLength(2); // Alice sent 2 messages
      expect(aliceWithMessages.messages[0].content).toBe('Hello Bob! How are you?');
      expect(aliceWithMessages.messages[1].content).toBe("That's wonderful to hear!");

      const getBobWithMessagesResponse = await request(app)
        .post('/graphql')
        .send({
          query: `
            query {
              user(id: "${bob.id}") {
                id
                name
                messages {
                  id
                  content
                }
              }
            }
          `
        })
        .expect(200);

      expect(getBobWithMessagesResponse.body.errors).toBeUndefined();
      const bobWithMessages = getBobWithMessagesResponse.body.data.user;
      expect(bobWithMessages.messages).toHaveLength(1); // Bob sent 1 message
      expect(bobWithMessages.messages[0].content).toBe("Hi Alice! I'm doing great, thanks for asking!");

      // Step 9: Update user lastSeen and verify
      const updateAliceLastSeenResponse = await request(app)
        .post('/graphql')
        .send({
          query: `
            mutation {
              updateUserLastSeen(id: "${alice.id}") {
                id
                name
                lastSeen
              }
            }
          `
        })
        .expect(200);

      expect(updateAliceLastSeenResponse.body.errors).toBeUndefined();
      const updatedAlice = updateAliceLastSeenResponse.body.data.updateUserLastSeen;
      
      // LastSeen should be more recent than original creation time
      const originalLastSeen = new Date(alice.lastSeen);
      const newLastSeen = new Date(updatedAlice.lastSeen);
      expect(newLastSeen.getTime()).toBeGreaterThanOrEqual(originalLastSeen.getTime());

      // Step 10: Verify final database state
      const finalDbUserCount = await prisma.user.count();
      const finalDbMessageCount = await prisma.message.count();
      
      expect(finalDbUserCount).toBe(2);
      expect(finalDbMessageCount).toBe(3);

      // Verify database relationships
      const dbMessages = await prisma.message.findMany({
        include: { user: true },
        orderBy: { createdAt: 'asc' }
      });

      expect(dbMessages[0].user.name).toBe('Alice');
      expect(dbMessages[1].user.name).toBe('Bob');
      expect(dbMessages[2].user.name).toBe('Alice');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle concurrent user creation', async () => {
      // Create multiple users simultaneously
      const userPromises = [
        request(app).post('/graphql').send({
          query: 'mutation { createUser(name: "User1") { id name } }'
        }),
        request(app).post('/graphql').send({
          query: 'mutation { createUser(name: "User2") { id name } }'
        }),
        request(app).post('/graphql').send({
          query: 'mutation { createUser(name: "User3") { id name } }'
        })
      ];

      const responses = await Promise.all(userPromises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();
        expect(response.body.data.createUser.id).toBeTruthy();
      });

      // Verify all users were created
      const userCount = await prisma.user.count();
      expect(userCount).toBe(3);
    });

    it('should validate input data properly across all operations', async () => {
      // Test various invalid inputs
      const invalidUserNameResponse = await request(app)
        .post('/graphql')
        .send({
          query: 'mutation { createUser(name: "   ") { id } }'
        });

      expect(invalidUserNameResponse.body.errors).toBeDefined();

      // Create valid user for message tests
      const validUser = await prisma.user.create({
        data: { name: 'Valid User' }
      });

      const invalidMessageResponse = await request(app)
        .post('/graphql')
        .send({
          query: `mutation { createMessage(content: "", userId: "${validUser.id}") { id } }`
        });

      expect(invalidMessageResponse.body.errors).toBeDefined();

      const tooLongMessageResponse = await request(app)
        .post('/graphql')
        .send({
          query: `mutation { createMessage(content: "${'A'.repeat(1001)}", userId: "${validUser.id}") { id } }`
        });

      expect(tooLongMessageResponse.body.errors).toBeDefined();
    });
  });
});