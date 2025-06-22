const request = require('supertest');
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { makeExecutableSchema } = require('@graphql-tools/schema');

const { typeDefs: messageTestTypeDefs } = require('../src/schema/typeDefs');
const { resolvers: messageTestResolvers } = require('../src/resolvers');

describe('Message Resolvers Integration Tests', () => {
  let app;
  let server;
  let testUser;

  beforeEach(async () => {
    const schema = makeExecutableSchema({
      typeDefs: messageTestTypeDefs,
      resolvers: messageTestResolvers,
    });

    server = new ApolloServer({
      schema,
      context: () => ({
        prisma: global.testDb,
      }),
    });

    app = express();
    await server.start();
    server.applyMiddleware({ app, path: '/graphql' });

    // Create a test user for message tests
    testUser = await global.testDb.user.create({
      data: { name: 'Test User' }
    });
  });

  afterEach(async () => {
    await server.stop();
  });

  describe('createMessage mutation', () => {
    it('should create a new message with valid data', async () => {
      const mutation = {
        query: `
          mutation CreateMessage($content: String!, $userId: ID!) {
            createMessage(content: $content, userId: $userId) {
              id
              content
              createdAt
              user {
                id
                name
              }
            }
          }
        `,
        variables: {
          content: 'Hello, world!',
          userId: testUser.id
        }
      };

      const response = await request(app)
        .post('/graphql')
        .send(mutation)
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.createMessage).toBeDefined();
      expect(response.body.data.createMessage.content).toBe('Hello, world!');
      expect(response.body.data.createMessage.user.id).toBe(testUser.id);
      expect(response.body.data.createMessage.user.name).toBe('Test User');

      // Verify message was actually saved to database
      const savedMessage = await global.testDb.message.findUnique({
        where: { id: response.body.data.createMessage.id },
        include: { user: true }
      });
      expect(savedMessage).toBeTruthy();
      expect(savedMessage.content).toBe('Hello, world!');
      expect(savedMessage.userId).toBe(testUser.id);
    });

    it('should update user lastSeen when creating message', async () => {
      const originalLastSeen = testUser.lastSeen;
      
      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      const mutation = {
        query: `
          mutation CreateMessage($content: String!, $userId: ID!) {
            createMessage(content: $content, userId: $userId) {
              id
              content
            }
          }
        `,
        variables: {
          content: 'Test message',
          userId: testUser.id
        }
      };

      const response = await request(app)
        .post('/graphql')
        .send(mutation)
        .expect(200);

      expect(response.body.errors).toBeUndefined();

      // Verify user's lastSeen was updated
      const updatedUser = await global.testDb.user.findUnique({
        where: { id: testUser.id }
      });
      expect(updatedUser.lastSeen.getTime()).toBeGreaterThan(originalLastSeen.getTime());
    });

    it('should fail when creating message with empty content', async () => {
      const mutation = {
        query: `
          mutation CreateMessage($content: String!, $userId: ID!) {
            createMessage(content: $content, userId: $userId) {
              id
              content
            }
          }
        `,
        variables: {
          content: '',
          userId: testUser.id
        }
      };

      const response = await request(app)
        .post('/graphql')
        .send(mutation)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Message content cannot be empty');
      expect(response.body.data?.createMessage || null).toBeNull();

      // Verify no message was created
      const messageCount = await global.testDb.message.count();
      expect(messageCount).toBe(0);
    });

    it('should fail when creating message with content too long', async () => {
      const longContent = 'A'.repeat(1001); // Exceeds 1000 character limit

      const mutation = {
        query: `
          mutation CreateMessage($content: String!, $userId: ID!) {
            createMessage(content: $content, userId: $userId) {
              id
              content
            }
          }
        `,
        variables: {
          content: longContent,
          userId: testUser.id
        }
      };

      const response = await request(app)
        .post('/graphql')
        .send(mutation)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('1000');
      expect(response.body.data?.createMessage || null).toBeNull();
    });

    it('should fail for non-existent user', async () => {
      const mutation = {
        query: `
          mutation CreateMessage($content: String!, $userId: ID!) {
            createMessage(content: $content, userId: $userId) {
              id
              content
            }
          }
        `,
        variables: {
          content: 'Test message',
          userId: 'non-existent-id'
        }
      };

      const response = await request(app)
        .post('/graphql')
        .send(mutation)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.data?.createMessage || null).toBeNull();
    });

    it('should trim whitespace from message content', async () => {
      const mutation = {
        query: `
          mutation CreateMessage($content: String!, $userId: ID!) {
            createMessage(content: $content, userId: $userId) {
              id
              content
            }
          }
        `,
        variables: {
          content: '  Hello, world!  ',
          userId: testUser.id
        }
      };

      const response = await request(app)
        .post('/graphql')
        .send(mutation)
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.createMessage.content).toBe('Hello, world!');
    });
  });

  describe('messages query', () => {
    it('should return all messages ordered by createdAt asc', async () => {
      // Create test messages with specific timestamps
      const message1 = await global.testDb.message.create({
        data: {
          content: 'First message',
          userId: testUser.id,
          createdAt: new Date('2023-01-01T10:00:00Z')
        }
      });

      const message2 = await global.testDb.message.create({
        data: {
          content: 'Second message',
          userId: testUser.id,
          createdAt: new Date('2023-01-01T11:00:00Z')
        }
      });

      const query = {
        query: `
          query GetMessages {
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
      };

      const response = await request(app)
        .post('/graphql')
        .send(query)
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.messages).toHaveLength(2);
      
      // Should be ordered by createdAt asc (oldest first)
      expect(response.body.data.messages[0].content).toBe('First message');
      expect(response.body.data.messages[1].content).toBe('Second message');
      expect(response.body.data.messages[0].user.name).toBe('Test User');
    });

    it('should return empty array when no messages exist', async () => {
      const query = {
        query: `
          query GetMessages {
            messages {
              id
              content
            }
          }
        `
      };

      const response = await request(app)
        .post('/graphql')
        .send(query)
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.messages).toEqual([]);
    });

    it('should include user information with each message', async () => {
      const message = await global.testDb.message.create({
        data: {
          content: 'Test message',
          userId: testUser.id
        }
      });

      const query = {
        query: `
          query GetMessages {
            messages {
              id
              content
              user {
                id
                name
              }
            }
          }
        `
      };

      const response = await request(app)
        .post('/graphql')
        .send(query)
        .expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.messages[0].user).toEqual({
        id: testUser.id,
        name: testUser.name
      });
    });
  });

  describe('User.messages resolver', () => {
    it('should return user messages when querying user', async () => {
      // Create messages for the user
      await global.testDb.message.createMany({
        data: [
          { content: 'Message 1', userId: testUser.id },
          { content: 'Message 2', userId: testUser.id }
        ]
      });

      const query = {
        query: `
          query GetUser($id: ID!) {
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
      expect(response.body.data.user.messages).toHaveLength(2);
      expect(response.body.data.user.messages[0].content).toBe('Message 1');
      expect(response.body.data.user.messages[1].content).toBe('Message 2');
    });
  });
});