const { PrismaClient } = require('@prisma/client');

// Set test environment
process.env.NODE_ENV = 'test';

// Global test database client
global.testDb = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./test.db',
    },
  },
});

// Setup before all tests
beforeAll(async () => {
  // Ensure database schema is up to date
  const { execSync } = require('child_process');
  execSync('npx prisma db push --force-reset', {
    env: { ...process.env, DATABASE_URL: 'file:./test.db' },
    stdio: 'inherit',
  });
});

// Cleanup before each test (not after)
beforeEach(async () => {
  // Clean up test data in correct order (due to foreign key constraints)
  await global.testDb.message.deleteMany();
  await global.testDb.user.deleteMany();
});

// Cleanup after all tests
afterAll(async () => {
  await global.testDb.$disconnect();
});