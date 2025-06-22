module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/**/*.test.{js,ts}', 
    '**/?(*.)+(spec|test).{js,ts}'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.test.{js,ts}',
    '!src/**/index.{js,ts}',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 30000,
  // Run tests sequentially to prevent database locking
  maxWorkers: 1,
  maxConcurrency: 1,
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json'
    }],
    '^.+\\.js$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))',
  ],
};