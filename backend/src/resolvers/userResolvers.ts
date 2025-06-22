import { PubSub } from 'graphql-subscriptions';
import { validateUserName } from '../utils/validation';
import { GraphQLContext } from '../types/context';

const pubsub = new PubSub();

export const userResolvers = {
  Query: {
    users: async (parent, args, { prisma }: GraphQLContext) => {
      return await prisma.user.findMany({
        orderBy: { lastSeen: 'desc' },
      });
    },
    user: async (parent, { id }, { prisma }: GraphQLContext) => {
      return await prisma.user.findUnique({
        where: { id },
      });
    },
  },

  Mutation: {
    createUser: async (parent, { name }, { prisma }: GraphQLContext) => {
      const validatedName = validateUserName(name);
      
      const user = await prisma.user.create({
        data: { name: validatedName },
      });
      
      pubsub.publish('USER_JOINED', { userJoined: user });
      return user;
    },
    
    updateUserLastSeen: async (parent, { id }, { prisma }: GraphQLContext) => {
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
    messages: async (parent: any, args, { prisma }: GraphQLContext) => {
      return await prisma.message.findMany({
        where: { userId: parent.id },
        orderBy: { createdAt: 'asc' },
      });
    },
  },
};