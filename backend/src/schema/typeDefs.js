const { gql } = require('apollo-server-express');

const typeDefs = gql`
  scalar DateTime

  type User {
    id: ID!
    name: String!
    createdAt: DateTime!
    lastSeen: DateTime!
    messages: [Message!]!
  }

  type Message {
    id: ID!
    content: String!
    createdAt: DateTime!
    user: User!
  }

  type Query {
    users: [User!]!
    messages: [Message!]!
    user(id: ID!): User
  }

  type Mutation {
    createUser(name: String!): User!
    updateUserLastSeen(id: ID!): User!
    createMessage(content: String!, userId: ID!): Message!
  }

  type Subscription {
    messageAdded: Message!
    userJoined: User!
  }
`;

module.exports = typeDefs;