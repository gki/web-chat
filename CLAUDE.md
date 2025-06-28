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
npm test                       # Run all tests (45 tests total)
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
- **Test success**: All 45 tests must pass before any commit

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

### Code Quality and Lint Management

#### Lint Error Resolution Workflow
When fixing lint errors, follow this systematic approach:

1. **Incremental Fixes**: Fix lint errors one by one, testing after each change
2. **Verification Required**: Always run `npm run lint` and `npm test` after each fix
3. **Never Break Tests**: Ensure all tests continue passing during lint fixes
4. **Test-Driven Approach**: Verify that fixes don't introduce regressions

#### Common Lint Error Patterns and Solutions

**Unused Variables and Imports:**
- Remove unused imports immediately
- For unused catch parameters: `catch (error)` → `catch` (omit parameter)
- For unused function parameters: prefix with underscore `_unused` or remove if possible
- Remove unused variables in test files when they serve no purpose

**Type Safety Issues:**
- Replace `any` types with proper TypeScript types
- Use `React.FormEvent` instead of `any` for event handlers
- Never use `as any` - find the proper type instead

**Console Statement Management:**
- Allow `console.error` and `console.warn` for important debugging
- Convert `console.log` to `console.warn` for better semantic meaning
- Disable console rules in test files and setup files via ESLint configuration
- For server files, disable console rules entirely as logging is essential

**Generated File Handling:**
- Never manually edit generated files (`**/generated/**/*`, `**/*generated*`)
- Configure ESLint to ignore generated files for type and style rules
- If lint errors persist in generated files, fix the generation configuration

#### ESLint Configuration Best Practices

**Rule Overrides by File Type:**
```javascript
// Generated files - ignore type rules
{ files: ['**/generated/**/*'], rules: { '@typescript-eslint/no-explicit-any': 'off' } }

// Test files - relax rules for testing convenience  
{ files: ['**/*.test.*'], rules: { 'no-console': 'off' } }

// Server files - allow console for logging
{ files: ['**/server.ts'], rules: { 'no-console': 'off' } }
```

**Database Testing Architecture:**
- **Isolated Test Databases**: Each test creates its own temporary SQLite database
- **Proper Cleanup**: Always disconnect and delete test database files in `afterEach`
- **No Global State**: Avoid global test database instances - use local `PrismaClient` per test
- **Schema Initialization**: Run `npx prisma db push` for each test database setup

#### Test Database Migration Pattern
```typescript
// Good: Local database per test
beforeEach(async () => {
  testDbPath = path.join(__dirname, `test-${Date.now()}-${Math.random()}.db`);
  prisma = new PrismaClient({ datasources: { db: { url: `file:${testDbPath}` } } });
  execSync('npx prisma db push', { env: { DATABASE_URL: `file:${testDbPath}` } });
});

afterEach(async () => {
  await prisma.$disconnect();
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
});
```

#### Commit Requirements
- **Zero Lint Errors**: All lint errors must be resolved before commit
- **All Tests Passing**: Both backend (26 tests) and frontend (19 tests) must pass
- **Type Compilation**: TypeScript must compile without errors in strict mode
- **Generated Files Excluded**: Never commit auto-generated JavaScript or type definition files