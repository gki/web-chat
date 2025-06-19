const userResolvers = require('./userResolvers');
const messageResolvers = require('./messageResolvers');

const resolvers = {
  DateTime: {
    serialize: (date) => date.toISOString(),
    parseValue: (value) => new Date(value),
    parseLiteral: (ast) => new Date(ast.value),
  },
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

module.exports = resolvers;