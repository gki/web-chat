import '@testing-library/jest-dom';

// Simple test setup without MSW for now
// MSW can be added later when needed for more complex testing

// Mock console.warn to avoid cluttering test output
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0]?.includes && args[0].includes('Invalid date')) {
    return; // Suppress date validation warnings in tests
  }
  originalWarn(...args);
};