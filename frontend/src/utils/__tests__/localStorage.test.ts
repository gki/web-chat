import { localStorage } from '../localStorage';
import { SavedUser } from '../../types/user';

// LocalStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

// WindowのLocalStorageをmock
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('localStorage utility', () => {
  const mockUser: SavedUser = {
    id: 'user-123',
    name: 'テストユーザー',
    lastSeen: '2023-01-01T10:00:00Z'
  };

  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('saveLastUser', () => {
    it('should save user to localStorage', () => {
      localStorage.saveLastUser(mockUser);
      
      const stored = localStorageMock.getItem('chatapp_last_user');
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!)).toEqual(mockUser);
    });

    it('should overwrite existing user', () => {
      const firstUser: SavedUser = { ...mockUser, name: 'First User' };
      const secondUser: SavedUser = { ...mockUser, name: 'Second User' };

      localStorage.saveLastUser(firstUser);
      localStorage.saveLastUser(secondUser);

      const stored = localStorage.getLastUser();
      expect(stored?.name).toBe('Second User');
    });

    it('should handle localStorage errors gracefully', () => {
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = jest.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      // エラーが投げられないことを確認
      expect(() => localStorage.saveLastUser(mockUser)).not.toThrow();

      localStorageMock.setItem = originalSetItem;
    });
  });

  describe('getLastUser', () => {
    it('should return saved user', () => {
      localStorage.saveLastUser(mockUser);
      const retrieved = localStorage.getLastUser();
      
      expect(retrieved).toEqual(mockUser);
    });

    it('should return null when no user is saved', () => {
      const retrieved = localStorage.getLastUser();
      expect(retrieved).toBeNull();
    });

    it('should return null for invalid data', () => {
      localStorageMock.setItem('chatapp_last_user', 'invalid json');
      const retrieved = localStorage.getLastUser();
      expect(retrieved).toBeNull();
    });

    it('should return null for data missing required fields', () => {
      const invalidUser = { id: 'user-123' }; // name and lastSeen missing
      localStorageMock.setItem('chatapp_last_user', JSON.stringify(invalidUser));
      
      const retrieved = localStorage.getLastUser();
      expect(retrieved).toBeNull();
    });

    it('should handle localStorage errors gracefully', () => {
      const originalGetItem = localStorageMock.getItem;
      localStorageMock.getItem = jest.fn(() => {
        throw new Error('localStorage not available');
      });

      const retrieved = localStorage.getLastUser();
      expect(retrieved).toBeNull();

      localStorageMock.getItem = originalGetItem;
    });
  });

  describe('removeLastUser', () => {
    it('should remove saved user', () => {
      localStorage.saveLastUser(mockUser);
      expect(localStorage.getLastUser()).toEqual(mockUser);

      localStorage.removeLastUser();
      expect(localStorage.getLastUser()).toBeNull();
    });

    it('should handle localStorage errors gracefully', () => {
      const originalRemoveItem = localStorageMock.removeItem;
      localStorageMock.removeItem = jest.fn(() => {
        throw new Error('localStorage not available');
      });

      // エラーが投げられないことを確認
      expect(() => localStorage.removeLastUser()).not.toThrow();

      localStorageMock.removeItem = originalRemoveItem;
    });
  });

  describe('isAvailable', () => {
    it('should return true when localStorage is available', () => {
      expect(localStorage.isAvailable()).toBe(true);
    });

    it('should return false when localStorage throws error', () => {
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = jest.fn(() => {
        throw new Error('localStorage not available');
      });

      expect(localStorage.isAvailable()).toBe(false);

      localStorageMock.setItem = originalSetItem;
    });
  });

  describe('SSR compatibility', () => {
    it('should handle undefined window gracefully', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Intentionally deleting window for SSR test
      delete global.window;

      expect(() => localStorage.saveLastUser(mockUser)).not.toThrow();
      expect(localStorage.getLastUser()).toBeNull();
      expect(() => localStorage.removeLastUser()).not.toThrow();
      expect(localStorage.isAvailable()).toBe(false);

      global.window = originalWindow;
    });
  });
});