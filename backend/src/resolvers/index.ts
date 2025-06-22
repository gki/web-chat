import { userResolvers } from './userResolvers';
import { messageResolvers } from './messageResolvers';
import { GraphQLScalarType, Kind } from 'graphql';

const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  serialize: (date: unknown) => {
    if (date instanceof Date) {
      return date.toISOString();
    }
    throw new Error('Value must be a Date instance');
  },
  parseValue: (value: unknown) => {
    if (typeof value === 'string') {
      return new Date(value);
    }
    throw new Error('Value must be a string');
  },
  parseLiteral: (ast) => {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  },
});

export const resolvers = {
  DateTime: DateTimeScalar,
  Query: {
    ...userResolvers.Query,
    ...messageResolvers.Query,
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...messageResolvers.Mutation,
  },
  Subscription: {
    ...messageResolvers.Subscription,
    ...userResolvers.Subscription,
  },
  User: userResolvers.User,
  Message: messageResolvers.Message,
};