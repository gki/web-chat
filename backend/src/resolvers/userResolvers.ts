import { PubSub } from 'graphql-subscriptions';
import { validateUserName } from '../utils/validation';
import { UserResolvers, QueryResolvers, MutationResolvers } from '../generated/graphql';

const pubsub = new PubSub();

const Query: QueryResolvers = {
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
};

const Mutation: MutationResolvers = {
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
};

const Subscription = {
  userJoined: {
    subscribe: () => pubsub.asyncIterator(['USER_JOINED']),
  },
};

const User: UserResolvers = {
  messages: async (parent, args, { prisma }) => {
    return await prisma.message.findMany({
      where: { userId: parent.id },
      orderBy: { createdAt: 'asc' },
    });
  },
};

export const userResolvers = {
  Query,
  Mutation,
  Subscription,
  User,
};