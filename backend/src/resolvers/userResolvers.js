const { PubSub } = require('graphql-subscriptions');
const { validateUserName } = require('../utils/validation');

const pubsub = new PubSub();

const userResolvers = {
  Query: {
    users: async (parent, args, { prisma }) => {
      return await prisma.user.findMany({
        orderBy: { lastSeen: 'desc' },
      });
    },
    user: async (parent, { id }, { prisma }) => {
      return await prisma.user.findUnique({
        where: { id },
      });
    },
  },

  Mutation: {
    createUser: async (parent, { name }, { prisma }) => {
      const validatedName = validateUserName(name);
      
      const user = await prisma.user.create({
        data: { name: validatedName },
      });
      
      pubsub.publish('USER_JOINED', { userJoined: user });
      return user;
    },
    
    updateUserLastSeen: async (parent, { id }, { prisma }) => {
      return await prisma.user.update({
        where: { id },
        data: { lastSeen: new Date() },
      });
    },
  },

  Subscription: {
    userJoined: {
      subscribe: () => pubsub.asyncIterator(['USER_JOINED']),
    },
  },

  User: {
    messages: async (parent, args, { prisma }) => {
      return await prisma.message.findMany({
        where: { userId: parent.id },
        orderBy: { createdAt: 'asc' },
      });
    },
  },
};

module.exports = userResolvers;