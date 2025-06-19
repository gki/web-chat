const { PubSub } = require('graphql-subscriptions');
const { validateMessageContent } = require('../utils/validation');

const pubsub = new PubSub();

const messageResolvers = {
  Query: {
    messages: async (parent, args, { prisma }) => {
      return await prisma.message.findMany({
        orderBy: { createdAt: 'asc' },
        include: { user: true },
      });
    },
  },

  Mutation: {
    createMessage: async (parent, { content, userId }, { prisma }) => {
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
    user: async (parent, args, { prisma }) => {
      return await prisma.user.findUnique({
        where: { id: parent.userId },
      });
    },
  },
};

module.exports = messageResolvers;