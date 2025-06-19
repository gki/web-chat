// Basic backend tests
const { validateUserName, validateMessageContent } = require('../src/utils/validation');

describe('Validation Functions', () => {
  describe('validateUserName', () => {
    it('should validate correct names', () => {
      expect(validateUserName('John Doe')).toBe('John Doe');
      expect(validateUserName('  Alice  ')).toBe('Alice');
    });

    it('should throw error for invalid names', () => {
      expect(() => validateUserName('')).toThrow();
      expect(() => validateUserName('   ')).toThrow();
      expect(() => validateUserName(null)).toThrow();
    });
  });

  describe('validateMessageContent', () => {
    it('should validate correct messages', () => {
      expect(validateMessageContent('Hello world')).toBe('Hello world');
      expect(validateMessageContent('  Test  ')).toBe('Test');
    });

    it('should throw error for invalid messages', () => {
      expect(() => validateMessageContent('')).toThrow();
      expect(() => validateMessageContent('   ')).toThrow();
      expect(() => validateMessageContent('A'.repeat(1001))).toThrow();
    });
  });
});