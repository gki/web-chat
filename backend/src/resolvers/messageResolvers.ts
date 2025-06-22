import { PubSub } from 'graphql-subscriptions';
import { validateMessageContent } from '../utils/validation';
import { GraphQLContext } from '../types/context';
import { MessageResolvers, QueryResolvers, MutationResolvers, SubscriptionResolvers } from '../generated/graphql';

const pubsub = new PubSub();

const Query: Pick<QueryResolvers, 'messages'> = {
  messages: async (parent, args, { prisma }) => {
    return await prisma.message.findMany({
      orderBy: { createdAt: 'asc' },
      include: { user: true },
    });
  },
};

const Mutation: Pick<MutationResolvers, 'createMessage'> = {
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
};

const Subscription = {
  messageAdded: {
    subscribe: () => pubsub.asyncIterator(['MESSAGE_ADDED']),
  },
};

const Message: MessageResolvers = {
  user: async (parent, args, { prisma }) => {
    const user = await prisma.user.findUnique({
      where: { id: parent.userId },
    });
    if (!user) {
      throw new Error(`User with id ${parent.userId} not found`);
    }
    return user;
  },
};

export const messageResolvers = {
  Query,
  Mutation,
  Subscription,
  Message,
};