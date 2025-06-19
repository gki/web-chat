# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Real-time chat application built with Node.js, React, GraphQL, and SQLite. Uses monorepo structure with npm workspaces.

## Tech Stack

- **Backend**: Node.js + Express + Apollo Server (GraphQL) + Prisma + SQLite
- **Frontend**: React.js + Vite + Apollo Client + Material-UI
- **Testing**: Jest + React Testing Library + MSW + Supertest
- **Code Quality**: ESLint + Prettier + husky + lint-staged

## Development Commands

### Root Level (runs across all workspaces)
```bash
npm install                    # Install all dependencies
npm run dev                    # Start both backend and frontend
npm test                       # Run all tests
npm run lint                   # Lint all code
npm run format                 # Format all code
```

### Backend (in /backend directory)
```bash
npm run dev                    # Start development server (nodemon)
npm run db:generate            # Generate Prisma client
npm run db:push                # Push schema changes to database
npm run db:studio              # Open Prisma Studio
npm test                       # Run Jest tests
npm run test:watch             # Run tests in watch mode
npm run test:coverage          # Run tests with coverage
```

### Frontend (in /frontend directory)
```bash
npm run dev                    # Start Vite dev server
npm run build                  # Build for production
npm run preview                # Preview production build
npm test                       # Run Jest tests
npm run test:watch             # Run tests in watch mode
```

## Architecture

### Database Schema (Prisma)
- **User**: id, name, createdAt, lastSeen
- **Message**: id, content, createdAt, userId (relation to User)

### GraphQL API
- **Queries**: users, messages, user(id)
- **Mutations**: createUser, updateUserLastSeen, createMessage
- **Subscriptions**: messageAdded, userJoined

### Frontend Components
- **App**: Main app component with user state management
- **UserLogin**: Name-based login form
- **ChatRoom**: Main chat interface with real-time updates
- **MessageList**: Displays messages with auto-scroll
- **MessageInput**: Message composition with validation
- **UserList**: Shows online users with status indicators

### Real-time Features
- GraphQL Subscriptions for message broadcasting
- Apollo Client cache updates for instant UI updates
- WebSocket connection for live updates
- User presence tracking with lastSeen timestamps

## Testing Strategy

### Backend Tests
- Unit tests for resolvers and validation functions
- Integration tests for GraphQL API with test database
- Uses Jest setup with Prisma test client

### Frontend Tests
- Component tests with React Testing Library
- MSW for GraphQL API mocking
- User interaction testing with user-event

## File Structure
```
backend/
├── src/
│   ├── schema/typeDefs.js     # GraphQL schema definition
│   ├── resolvers/             # GraphQL resolvers
│   ├── utils/validation.js    # Input validation
│   └── server.js              # Apollo Server setup
├── prisma/schema.prisma       # Database schema
└── __tests__/                 # Integration tests

frontend/
├── src/
│   ├── components/            # React components
│   ├── apollo/                # GraphQL client setup
│   ├── hooks/                 # Custom React hooks
│   └── main.jsx               # App entry point
└── public/                    # Static assets
```

## Development Notes

- Use TDD approach for new features
- All components should have corresponding tests
- Follow existing code patterns and conventions
- GraphQL subscriptions handle real-time updates
- Material-UI for consistent styling
- Validation on both client and server sides