import { gql } from '@apollo/client';

// User queries and mutations
export const GET_USERS = gql`
  query GetUsers {
    users {
      id
      name
      createdAt
      lastSeen
    }
  }
`;

export const GET_USER_BY_ID = gql`
  query GetUserById($id: ID!) {
    user(id: $id) {
      id
      name
      createdAt
      lastSeen
    }
  }
`;

export const CREATE_USER = gql`
  mutation CreateUser($name: String!) {
    createUser(name: $name) {
      id
      name
      createdAt
      lastSeen
    }
  }
`;

export const UPDATE_USER_LAST_SEEN = gql`
  mutation UpdateUserLastSeen($id: ID!) {
    updateUserLastSeen(id: $id) {
      id
      name
      lastSeen
    }
  }
`;

// Message queries and mutations
export const GET_MESSAGES = gql`
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
`;

export const CREATE_MESSAGE = gql`
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
`;

// Subscriptions
export const MESSAGE_ADDED_SUBSCRIPTION = gql`
  subscription MessageAdded {
    messageAdded {
      id
      content
      createdAt
      user {
        id
        name
      }
    }
  }
`;

export const USER_JOINED_SUBSCRIPTION = gql`
  subscription UserJoined {
    userJoined {
      id
      name
      createdAt
      lastSeen
    }
  }
`;