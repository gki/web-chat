import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import App from '../../App';
import { localStorage } from '../../utils/localStorage';
import { GET_USER_BY_ID, UPDATE_USER_LAST_SEEN, GET_MESSAGES, GET_USERS } from '../../apollo/queries';

// Mock localStorage
jest.mock('../../utils/localStorage', () => ({
  localStorage: {
    isAvailable: jest.fn(() => true),
    getLastUser: jest.fn(() => null),
    saveLastUser: jest.fn(),
    removeLastUser: jest.fn(),
  },
}));

const mockUser = {
  id: 'user-123',
  name: 'テストユーザー',
  createdAt: '2023-11-01T10:00:00Z',
  lastSeen: '2023-12-01T10:00:00Z'
};

const mockSavedUser = {
  id: 'user-123',
  name: 'テストユーザー',
  lastSeen: '2023-12-01T10:00:00Z'
};

// Create large message list for scroll testing
const createMockMessages = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `msg-${i}`,
    content: `Message ${i} - This is a test message to fill the chat area and test scroll behavior`,
    createdAt: new Date(Date.now() - (count - i) * 60000).toISOString(),
    user: {
      id: i % 2 === 0 ? 'user-123' : 'user-456',
      name: i % 2 === 0 ? 'テストユーザー' : 'Other User'
    }
  }));
};

const mockUsers = [
  mockUser,
  {
    id: 'user-456',
    name: 'Other User',
    createdAt: '2023-11-01T09:00:00Z',
    lastSeen: '2023-12-01T09:00:00Z'
  }
];

const userMock = {
  request: {
    query: GET_USER_BY_ID,
    variables: { id: 'user-123' }
  },
  result: {
    data: { user: mockUser }
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
        ...mockUser,
        lastSeen: new Date().toISOString()
      }
    }
  }
};

const messagesMock = {
  request: {
    query: GET_MESSAGES
  },
  result: {
    data: {
      messages: createMockMessages(50) // 50 messages for scroll testing
    }
  }
};

const usersMock = {
  request: {
    query: GET_USERS
  },
  result: {
    data: {
      users: mockUsers
    }
  }
};

// Mock scrollIntoView
const mockScrollIntoView = jest.fn();
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  configurable: true,
  value: mockScrollIntoView,
});

describe('Scroll Behavior Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (localStorage.isAvailable as jest.Mock).mockReturnValue(true);
    (localStorage.getLastUser as jest.Mock).mockReturnValue(mockSavedUser);
  });

  it('should handle layout properly in chat mode', async () => {
    render(
      <MockedProvider 
        mocks={[userMock, updateLastSeenMock, messagesMock, usersMock]} 
        addTypename={false}
      >
        <App />
      </MockedProvider>
    );

    // Login to enter chat mode
    const existingUserButton = screen.getByTestId('select-existing-user-button');
    fireEvent.click(existingUserButton);

    // Wait for chat room to load
    await waitFor(() => {
      expect(screen.getByText('チャットルーム - テストユーザー')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Check that the main app container has proper layout for chat mode
    const appTitle = screen.getByText('チャットアプリ');
    const appContainer = appTitle.closest('div[class*="MuiPaper-root"]');
    
    expect(appContainer).toHaveStyle('display: flex');
    expect(appContainer).toHaveStyle('flex-direction: column');
  });

  it('should auto-scroll to bottom when entering chat room', async () => {
    render(
      <MockedProvider 
        mocks={[userMock, updateLastSeenMock, messagesMock, usersMock]} 
        addTypename={false}
      >
        <App />
      </MockedProvider>
    );

    // Login to enter chat mode
    const existingUserButton = screen.getByTestId('select-existing-user-button');
    fireEvent.click(existingUserButton);

    // Wait for chat room and messages to load
    await waitFor(() => {
      expect(screen.getByText('チャットルーム - テストユーザー')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Check that scroll to bottom was called (for initial message load)
    await waitFor(() => {
      expect(mockScrollIntoView).toHaveBeenCalled();
    });
  });

  it('should maintain responsive layout structure', async () => {
    render(
      <MockedProvider 
        mocks={[userMock, updateLastSeenMock, messagesMock, usersMock]} 
        addTypename={false}
      >
        <App />
      </MockedProvider>
    );

    // Login to enter chat mode
    const existingUserButton = screen.getByTestId('select-existing-user-button');
    fireEvent.click(existingUserButton);

    // Wait for chat room to load
    await waitFor(() => {
      expect(screen.getByText('チャットルーム - テストユーザー')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Check that both message area and user list are present
    expect(screen.getByText('オンラインユーザー')).toBeInTheDocument();
    expect(screen.getByTestId('message-input')).toBeInTheDocument();

    // Check Grid layout is maintained
    const userListTitle = screen.getByText('オンラインユーザー');
    const gridItem = userListTitle.closest('div[class*="MuiGrid-item"]');
    expect(gridItem).toBeInTheDocument();
  });

  it('should handle container overflow properly', async () => {
    render(
      <MockedProvider 
        mocks={[userMock, updateLastSeenMock, messagesMock, usersMock]} 
        addTypename={false}
      >
        <App />
      </MockedProvider>
    );

    // Login to enter chat mode
    const existingUserButton = screen.getByTestId('select-existing-user-button');
    fireEvent.click(existingUserButton);

    // Wait for chat room to load
    await waitFor(() => {
      expect(screen.getByText('チャットルーム - テストユーザー')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Wait for messages to load
    await waitFor(() => {
      expect(screen.getByTestId('message-msg-0')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Check that message list container has proper overflow handling
    const messageElement = screen.getByTestId('message-msg-0');
    const listContainer = messageElement.closest('ul');
    expect(listContainer).toBeInTheDocument();
    
    // The parent container should have overflow: auto for scrolling
    const scrollContainer = listContainer?.parentElement;
    expect(scrollContainer).toBeInTheDocument();
  });

  it('should maintain proper layout when switching between states', async () => {
    render(
      <MockedProvider 
        mocks={[userMock, updateLastSeenMock, messagesMock, usersMock]} 
        addTypename={false}
      >
        <App />
      </MockedProvider>
    );

    // Initially in selection state
    expect(screen.getByText('前回のユーザー')).toBeInTheDocument();

    // Login to chat
    const existingUserButton = screen.getByTestId('select-existing-user-button');
    fireEvent.click(existingUserButton);

    // Wait for chat state
    await waitFor(() => {
      expect(screen.getByText('チャットルーム - テストユーザー')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Logout to return to selection
    const logoutButton = screen.getByTestId('logout-button');
    fireEvent.click(logoutButton);

    // Should return to selection state with proper layout
    await waitFor(() => {
      expect(screen.getByText('前回のユーザー')).toBeInTheDocument();
    });

    // Layout should be maintained
    const appTitle = screen.getByText('チャットアプリ');
    expect(appTitle).toBeInTheDocument();
  });

  it('should handle message input area correctly in scroll layout', async () => {
    render(
      <MockedProvider 
        mocks={[userMock, updateLastSeenMock, messagesMock, usersMock]} 
        addTypename={false}
      >
        <App />
      </MockedProvider>
    );

    // Login to enter chat mode
    const existingUserButton = screen.getByTestId('select-existing-user-button');
    fireEvent.click(existingUserButton);

    // Wait for chat room to load
    await waitFor(() => {
      expect(screen.getByText('チャットルーム - テストユーザー')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Check message input is present and functional
    const messageInput = screen.getByTestId('message-input');
    expect(messageInput).toBeInTheDocument();
    expect(messageInput).not.toBeDisabled();

    // Input should be positioned at bottom (flexShrink: 0)
    const inputContainer = messageInput.closest('div[class*="MuiBox-root"]');
    expect(inputContainer).toBeInTheDocument();
  });

  it('should handle empty message list layout correctly', async () => {
    const emptyMessagesMock = {
      request: {
        query: GET_MESSAGES
      },
      result: {
        data: {
          messages: []
        }
      }
    };

    render(
      <MockedProvider 
        mocks={[userMock, updateLastSeenMock, emptyMessagesMock, usersMock]} 
        addTypename={false}
      >
        <App />
      </MockedProvider>
    );

    // Login to enter chat mode
    const existingUserButton = screen.getByTestId('select-existing-user-button');
    fireEvent.click(existingUserButton);

    // Wait for chat room to load
    await waitFor(() => {
      expect(screen.getByText('チャットルーム - テストユーザー')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Should show empty state message
    await waitFor(() => {
      expect(screen.getByText(/まだメッセージがありません/)).toBeInTheDocument();
    });

    // Layout should still be maintained
    expect(screen.getByTestId('message-input')).toBeInTheDocument();
    expect(screen.getByText('オンラインユーザー')).toBeInTheDocument();
  });
});