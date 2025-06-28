import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';

import App from '../../App';
import { localStorage } from '../../utils/localStorage';
import { SavedUser } from '../../types/user';
import { GET_USER_BY_ID, UPDATE_USER_LAST_SEEN, CREATE_USER, GET_MESSAGES, GET_USERS } from '../../apollo/queries';

// Mock localStorage
jest.mock('../../utils/localStorage', () => ({
  localStorage: {
    isAvailable: jest.fn(() => true),
    getLastUser: jest.fn(() => null),
    saveLastUser: jest.fn(),
    removeLastUser: jest.fn(),
  },
}));

const mockSavedUser: SavedUser = {
  id: 'user-123',
  name: 'テストユーザー',
  lastSeen: '2023-12-01T10:00:00Z'
};

const mockValidUser = {
  id: 'user-123',
  name: 'テストユーザー',
  createdAt: '2023-11-01T10:00:00Z',
  lastSeen: '2023-12-01T10:00:00Z'
};

const validUserMock = {
  request: {
    query: GET_USER_BY_ID,
    variables: { id: 'user-123' }
  },
  result: {
    data: { user: mockValidUser }
  }
};

const updateLastSeenMock = {
  request: {
    query: UPDATE_USER_LAST_SEEN,
    variables: { id: 'user-123' }
  },
  result: {
    data: {
      updateUserLastSeen: {
        ...mockValidUser,
        lastSeen: new Date().toISOString()
      }
    }
  }
};

const createUserMock = {
  request: {
    query: CREATE_USER,
    variables: { name: '新しいユーザー' }
  },
  result: {
    data: {
      createUser: {
        id: 'new-user-456',
        name: '新しいユーザー',
        createdAt: new Date().toISOString(),
        lastSeen: new Date().toISOString()
      }
    }
  }
};

// ChatRoom polling queries mocks
const getMessagesMock = {
  request: {
    query: GET_MESSAGES
  },
  result: {
    data: {
      messages: []
    }
  }
};

const getUsersMock = {
  request: {
    query: GET_USERS
  },
  result: {
    data: {
      users: [mockValidUser]
    }
  }
};

describe('App Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial state with no saved user', () => {
    beforeEach(() => {
      (localStorage.getLastUser as jest.Mock).mockReturnValue(null);
      (localStorage.isAvailable as jest.Mock).mockReturnValue(true);
    });

    it('shows login form initially when no saved user', () => {
      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <App />
        </MockedProvider>
      );

      expect(screen.getByText('チャットアプリ')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'チャットに参加' })).toBeInTheDocument();
      expect(screen.getByTestId('name-input')).toBeInTheDocument();
    });

    it('shows login form when localStorage is not available', () => {
      (localStorage.isAvailable as jest.Mock).mockReturnValue(false);

      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <App />
        </MockedProvider>
      );

      expect(screen.getByTestId('name-input')).toBeInTheDocument();
    });
  });

  describe('Initial state with saved user', () => {
    beforeEach(() => {
      (localStorage.getLastUser as jest.Mock).mockReturnValue(mockSavedUser);
      (localStorage.isAvailable as jest.Mock).mockReturnValue(true);
    });

    it('shows user selection when saved user exists', () => {
      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <App />
        </MockedProvider>
      );

      expect(screen.getByText('前回のユーザー')).toBeInTheDocument();
      expect(screen.getByText('テストユーザー')).toBeInTheDocument();
      expect(screen.getByTestId('select-existing-user-button')).toBeInTheDocument();
      expect(screen.getByTestId('create-new-user-button')).toBeInTheDocument();
    });

    it('handles existing user selection successfully', async () => {
      render(
        <MockedProvider mocks={[
          validUserMock,
          updateLastSeenMock,
          getMessagesMock,
          getUsersMock
        ]} addTypename={false}>
          <App />
        </MockedProvider>
      );

      const existingUserButton = screen.getByTestId('select-existing-user-button');
      fireEvent.click(existingUserButton);

      // Should eventually show chat room (checking for a unique element)
      await waitFor(() => {
        // ChatRoom should have user list or message input
        expect(screen.getByText('オンラインユーザー') || screen.getByTestId('message-input')).toBeInTheDocument();
      }, { timeout: 3000 });

      expect(localStorage.saveLastUser).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-123',
          name: 'テストユーザー'
        })
      );
    });

    it('handles user not found error', async () => {
      const invalidUserMock = {
        request: {
          query: GET_USER_BY_ID,
          variables: { id: 'user-123' }
        },
        result: {
          data: { user: null }
        }
      };

      render(
        <MockedProvider mocks={[invalidUserMock]} addTypename={false}>
          <App />
        </MockedProvider>
      );

      const existingUserButton = screen.getByTestId('select-existing-user-button');
      fireEvent.click(existingUserButton);

      await waitFor(() => {
        expect(screen.getByText('このユーザーは存在しません。新しいユーザーを作成してください。')).toBeInTheDocument();
      });
    });

    it('transitions to login when creating new user', () => {
      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <App />
        </MockedProvider>
      );

      const newUserButton = screen.getByTestId('create-new-user-button');
      fireEvent.click(newUserButton);

      expect(screen.getByTestId('name-input')).toBeInTheDocument();
    });

    it('deletes saved user and transitions to login', () => {
      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <App />
        </MockedProvider>
      );

      const deleteButton = screen.getByTestId('delete-saved-user-button');
      fireEvent.click(deleteButton);

      expect(localStorage.removeLastUser).toHaveBeenCalled();
      expect(screen.getByTestId('name-input')).toBeInTheDocument();
    });
  });

  describe('User login flow', () => {
    beforeEach(() => {
      (localStorage.getLastUser as jest.Mock).mockReturnValue(null);
      (localStorage.isAvailable as jest.Mock).mockReturnValue(true);
    });

    it('saves user to localStorage after successful login', async () => {
      render(
        <MockedProvider mocks={[createUserMock, getUsersMock, getMessagesMock]} addTypename={false}>
          <App />
        </MockedProvider>
      );

      const nameInput = screen.getByTestId('name-input').querySelector('input');
      const joinButton = screen.getByTestId('join-button');

      fireEvent.change(nameInput, { target: { value: '新しいユーザー' } });
      fireEvent.click(joinButton);

      await waitFor(() => {
        expect(localStorage.saveLastUser).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'new-user-456',
            name: '新しいユーザー'
          })
        );
      });
    });
  });

  describe('Logout flow', () => {
    it('returns to selection when logged out with saved user', async () => {
      (localStorage.getLastUser as jest.Mock).mockReturnValue(mockSavedUser);
      (localStorage.isAvailable as jest.Mock).mockReturnValue(true);

      render(
        <MockedProvider mocks={[
          validUserMock,
          updateLastSeenMock,
          getMessagesMock,
          getUsersMock
        ]} addTypename={false}>
          <App />
        </MockedProvider>
      );

      // First login
      const existingUserButton = screen.getByTestId('select-existing-user-button');
      fireEvent.click(existingUserButton);

      // Wait for chat room to appear and then logout
      await waitFor(() => {
        const logoutButton = screen.getByTestId('logout-button');
        fireEvent.click(logoutButton);
      }, { timeout: 3000 });

      // Should return to selection screen
      await waitFor(() => {
        expect(screen.getByText('前回のユーザー')).toBeInTheDocument();
      });
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      (localStorage.getLastUser as jest.Mock).mockReturnValue(mockSavedUser);
      (localStorage.isAvailable as jest.Mock).mockReturnValue(true);
    });

    it('handles GraphQL errors gracefully', async () => {
      const errorMock = {
        request: {
          query: GET_USER_BY_ID,
          variables: { id: 'user-123' }
        },
        error: new Error('Network error')
      };

      render(
        <MockedProvider mocks={[errorMock]} addTypename={false}>
          <App />
        </MockedProvider>
      );

      const existingUserButton = screen.getByTestId('select-existing-user-button');
      fireEvent.click(existingUserButton);

      await waitFor(() => {
        expect(screen.getByText('ユーザーの確認に失敗しました。しばらくしてから再試行してください。')).toBeInTheDocument();
      });
    });
  });

  describe('Layout and scroll behavior', () => {
    beforeEach(() => {
      (localStorage.getLastUser as jest.Mock).mockReturnValue(mockSavedUser);
      (localStorage.isAvailable as jest.Mock).mockReturnValue(true);
    });

    it('applies correct layout styles for chat state', async () => {
      render(
        <MockedProvider mocks={[
          validUserMock,
          updateLastSeenMock,
          getMessagesMock,
          getUsersMock
        ]} addTypename={false}>
          <App />
        </MockedProvider>
      );

      const existingUserButton = screen.getByTestId('select-existing-user-button');
      fireEvent.click(existingUserButton);

      // Wait for transition to chat state
      await waitFor(() => {
        expect(screen.getByText('チャットルーム - テストユーザー')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Check that the main container has proper layout styles
      const appTitle = screen.getByText('チャットアプリ');
      const paperContainer = appTitle.closest('[class*="MuiPaper-root"]');

      expect(paperContainer).toBeInTheDocument();
      // The container should have flex display when in chat mode
      expect(paperContainer).toHaveStyle('display: flex');
    });

    it('applies correct layout styles for non-chat states', () => {
      (localStorage.getLastUser as jest.Mock).mockReturnValue(null);

      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <App />
        </MockedProvider>
      );

      const appTitle = screen.getByText('チャットアプリ');
      const paperContainer = appTitle.closest('[class*="MuiPaper-root"]');

      expect(paperContainer).toBeInTheDocument();
      // Should still have flex display but different overflow behavior
      expect(paperContainer).toHaveStyle('display: flex');
    });
  });
});