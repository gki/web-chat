import { PubSub } from 'graphql-subscriptions';
import { validateMessageContent } from '../utils/validation';
import { GraphQLContext } from '../types/context';

const pubsub = new PubSub();

export const messageResolvers = {
  Query: {
    messages: async (parent, args, { prisma }: GraphQLContext) => {
      return await prisma.message.findMany({
        orderBy: { createdAt: 'asc' },
        include: { user: true },
      });
    },
  },

  Mutation: {
    createMessage: async (parent, { content, userId }, { prisma }: GraphQLContext) => {
      const validatedContent = validateMessageContent(content);
      
      const message = await prisma.message.create({
        data: {
          content: validatedContent,
          userId,
        },
        include: { user: true },
      });

      // Update user's last seen
      await prisma.user.update({
        where: { id: userId },
        data: { lastSeen: new Date() },
      });

      pubsub.publish('MESSAGE_ADDED', { messageAdded: message });
      return message;
    },
  },

  Subscription: {
    messageAdded: {
      subscribe: () => pubsub.asyncIterator(['MESSAGE_ADDED']),
    },
  },

  Message: {
    user: async (parent: any, args, { prisma }: GraphQLContext) => {
      return await prisma.user.findUnique({
        where: { id: parent.userId },
      });
    },
  },
};