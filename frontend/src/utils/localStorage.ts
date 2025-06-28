import { SavedUser } from '../types/user';

const STORAGE_KEY = 'chatapp_last_user';

export const localStorage = {
  /**
   * 前回ユーザー情報を保存する
   */
  saveLastUser: (user: SavedUser): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      }
    } catch (error) {
      console.warn('Failed to save user to localStorage:', error);
    }
  },

  /**
   * 前回ユーザー情報を取得する
   */
  getLastUser: (): SavedUser | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // バリデーション
          if (parsed && typeof parsed.id === 'string' && typeof parsed.name === 'string' && typeof parsed.lastSeen === 'string') {
            return parsed as SavedUser;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to get user from localStorage:', error);
    }
    return null;
  },

  /**
   * 前回ユーザー情報を削除する
   */
  removeLastUser: (): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.warn('Failed to remove user from localStorage:', error);
    }
  },

  /**
   * LocalStorageが利用可能かチェックする
   */
  isAvailable: (): boolean => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      // テスト書き込みで利用可能性確認
      const testKey = '__test__';
      window.localStorage.setItem(testKey, 'test');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
};