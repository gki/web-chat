# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Real-time chat application built with Node.js, React, GraphQL, and SQLite. Uses monorepo structure with npm workspaces. **Fully migrated to TypeScript** with strict type checking enabled.

## Tech Stack

- **Backend**: Node.js + Express + Apollo Server (GraphQL) + Prisma + SQLite + TypeScript
- **Frontend**: React.js + Vite + Apollo Client + Material-UI + TypeScript
- **Testing**: Jest + React Testing Library + MSW + Supertest
- **Code Quality**: ESLint + Prettier + husky + lint-staged
- **Type Generation**: GraphQL Code Generator for automatic type generation

## Development Commands

### Root Level (runs across all workspaces)
```bash
npm install                    # Install all dependencies
npm run dev                    # Start both backend and frontend
npm test                       # Run all tests (52 tests total)
npm run lint                   # Lint all code
npm run format                 # Format all code
npm run codegen                # Generate GraphQL types
npm run codegen:watch          # Generate GraphQL types in watch mode
```

### Backend (in /backend directory)
```bash
npm run dev                    # Start development server (nodemon)
npm run build                  # Build TypeScript to JavaScript
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

### Single Test Execution
```bash
# Run specific test file
npm test -- basic.test.ts                    # Backend unit tests
npm test -- userResolvers.integration.test.ts # Backend integration tests
npm test -- App.test.tsx                     # Frontend component tests

# Run with watch mode
npm test -- --watch basic.test.ts
```

## Architecture Overview

### Monorepo Structure
- **Workspaces**: Backend and frontend as separate npm workspaces
- **Shared Types**: GraphQL types auto-generated and shared across workspaces
- **Database**: Single SQLite database accessed by backend only
- **Real-time**: GraphQL Subscriptions over WebSocket for live updates

### TypeScript Configuration
- **Strict Mode**: Enabled with `strict: true` and `noImplicitAny: true`
- **Type Generation**: Automatic GraphQL type generation from schema
- **Module System**: CommonJS for backend, ES modules for frontend
- **Build Artifacts**: Excluded from Git (`.d.ts`, `.js.map`, generated `.js` files)

### GraphQL Type Generation System
- **Schema Source**: `backend/src/schema/typeDefs.ts`
- **Backend Types**: Auto-generated resolver types in `backend/src/generated/graphql.ts`
- **Frontend Types**: Auto-generated hooks and types in `frontend/src/generated/graphql.ts`
- **Mappers**: Prisma types mapped to GraphQL types for type safety

### Database and API Layer
- **Prisma**: ORM with SQLite database, full TypeScript integration
- **Schema**: Users and Messages with foreign key relationships
- **GraphQL Layer**: Apollo Server with subscriptions for real-time features
- **Context**: Shared Prisma client passed through GraphQL context

### Testing Architecture
- **Backend Tests**: 
  - Unit tests for validation and utility functions
  - Integration tests for full GraphQL API workflows
  - Database isolation with test-specific SQLite instances
- **Frontend Tests**:
  - Component tests with React Testing Library
  - Integration tests with MSW for API mocking
  - User interaction testing with user-event
- **Test Configuration**: Sequential execution (`maxWorkers: 1`) to prevent database locking

## Critical Development Rules

### TypeScript Standards
- **NO `any` types**: Use proper type definitions, never use `as any` or `as unknown`
- **Strict typing**: All functions must have proper parameter and return types
- **Generated types**: Use GraphQL-generated types for resolvers and API calls

### Testing Requirements
- **TDD approach**: Write tests before implementation
- **Complete coverage**: Both unit and integration tests required
- **No shortcuts**: Implement full validation logic, never stub critical test logic
- **Database integrity**: Tests must use proper setup/teardown for database state

### Git and Build Management
- **Source only**: Only commit TypeScript source files, not generated JavaScript
- **Type safety**: All commits must pass TypeScript compilation with strict settings
- **Test success**: All 52 tests must pass before any commit

### GraphQL Integration
- **Schema-first**: GraphQL schema drives type generation
- **Type safety**: Use generated resolver types, never override with `any`
- **Subscriptions**: Handle async iterators properly without type bypassing
- **Error handling**: Proper error handling for non-nullable GraphQL fields

## Common Development Workflows

### Adding New Features
1. Update GraphQL schema in `backend/src/schema/typeDefs.ts`
2. Run `npm run codegen` to generate new types
3. Implement backend resolvers using generated types
4. Add frontend queries/mutations using generated hooks
5. Write comprehensive tests covering the full workflow

### Database Schema Changes
1. Update `backend/prisma/schema.prisma`
2. Run `npm run db:push` to apply changes
3. Update GraphQL schema if needed
4. Regenerate types with `npm run codegen`
5. Update resolvers and tests accordingly

### Type Safety Maintenance
- **After schema changes**: Always run codegen and verify no type errors
- **Resolver implementation**: Use generated `*Resolvers` types exclusively  
- **Frontend queries**: Use generated hooks from `frontend/src/generated/graphql.ts`
- **Error resolution**: Fix type errors with proper typing, never with type assertions