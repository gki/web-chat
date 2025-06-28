import React from 'react';
import { render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import ChatRoom from '../ChatRoom';
import { User } from '../../types/user';
import { GET_MESSAGES, GET_USERS, UPDATE_USER_LAST_SEEN } from '../../apollo/queries';

const mockUser: User = {
  id: 'user-123',
  name: 'テストユーザー',
  createdAt: '2023-11-01T10:00:00Z',
  lastSeen: '2023-12-01T10:00:00Z'
};

const mockMessages = [
  {
    id: 'msg-1',
    content: 'Hello',
    createdAt: '2023-12-01T10:00:00Z',
    user: mockUser
  },
  {
    id: 'msg-2', 
    content: 'World',
    createdAt: '2023-12-01T10:01:00Z',
    user: mockUser
  }
];

const mockUsers = [mockUser];

const messagesMock = {
  request: {
    query: GET_MESSAGES
  },
  result: {
    data: {
      messages: mockMessages
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

// Add UPDATE_USER_LAST_SEEN mock to prevent warning
const updateLastSeenMock = {
  request: {
    query: UPDATE_USER_LAST_SEEN,
    variables: { id: 'user-123' }
  },
  result: {
    data: {
      updateUserLastSeen: mockUser
    }
  }
};

const defaultProps = {
  currentUser: mockUser,
  onLogout: jest.fn()
};

describe('ChatRoom', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders chat room layout correctly', () => {
    render(
      <MockedProvider mocks={[messagesMock, usersMock, updateLastSeenMock]} addTypename={false}>
        <ChatRoom {...defaultProps} />
      </MockedProvider>
    );

    expect(screen.getByText('チャットルーム - テストユーザー')).toBeInTheDocument();
    expect(screen.getByText('オンラインユーザー')).toBeInTheDocument();
    expect(screen.getByTestId('logout-button')).toBeInTheDocument();
  });

  it('applies correct flexbox layout styles', () => {
    render(
      <MockedProvider mocks={[messagesMock, usersMock, updateLastSeenMock]} addTypename={false}>
        <ChatRoom {...defaultProps} />
      </MockedProvider>
    );

    // Check main container has proper flex layout
    const mainTitle = screen.getByText('チャットルーム - テストユーザー');
    const mainContainer = mainTitle.closest('[class*="MuiBox-root"]');
    
    expect(mainContainer).toHaveStyle('display: flex');
    expect(mainContainer).toHaveStyle('flex-direction: column');
    expect(mainContainer).toHaveStyle('overflow: hidden');
  });

  it('renders message list and user list areas', () => {
    render(
      <MockedProvider mocks={[messagesMock, usersMock, updateLastSeenMock]} addTypename={false}>
        <ChatRoom {...defaultProps} />
      </MockedProvider>
    );

    // Message area should be present
    expect(screen.getByText('オンラインユーザー')).toBeInTheDocument();
    
    // Message input should be present
    expect(screen.getByTestId('message-input')).toBeInTheDocument();
  });

  it('handles responsive layout for different screen sizes', () => {
    render(
      <MockedProvider mocks={[messagesMock, usersMock, updateLastSeenMock]} addTypename={false}>
        <ChatRoom {...defaultProps} />
      </MockedProvider>
    );

    // Check that Grid items are properly configured
    const userListTitle = screen.getByText('オンラインユーザー');
    const userListContainer = userListTitle.closest('[class*="MuiGrid-item"]');
    
    expect(userListContainer).toBeInTheDocument();
  });

  it('maintains proper scroll behavior structure', () => {
    render(
      <MockedProvider mocks={[messagesMock, usersMock, updateLastSeenMock]} addTypename={false}>
        <ChatRoom {...defaultProps} />
      </MockedProvider>
    );

    // The layout should be set up for proper scrolling
    const userListTitle = screen.getByText('オンラインユーザー');
    const paperContainer = userListTitle.closest('[class*="MuiPaper-root"]');
    
    expect(paperContainer).toHaveStyle('display: flex');
    expect(paperContainer).toHaveStyle('flex-direction: column');
  });

  it('calls onLogout when logout button is clicked', () => {
    const onLogout = jest.fn();
    
    render(
      <MockedProvider mocks={[messagesMock, usersMock, updateLastSeenMock]} addTypename={false}>
        <ChatRoom {...defaultProps} onLogout={onLogout} />
      </MockedProvider>
    );

    const logoutButton = screen.getByTestId('logout-button');
    logoutButton.click();

    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('displays current user name in header', () => {
    const customUser = { ...mockUser, name: 'カスタムユーザー' };
    
    render(
      <MockedProvider mocks={[messagesMock, usersMock, updateLastSeenMock]} addTypename={false}>
        <ChatRoom {...defaultProps} currentUser={customUser} />
      </MockedProvider>
    );

    expect(screen.getByText('チャットルーム - カスタムユーザー')).toBeInTheDocument();
  });

  it('renders with proper accessibility structure', () => {
    render(
      <MockedProvider mocks={[messagesMock, usersMock, updateLastSeenMock]} addTypename={false}>
        <ChatRoom {...defaultProps} />
      </MockedProvider>
    );

    // Check for proper heading structure
    expect(screen.getByRole('heading', { name: 'オンラインユーザー' })).toBeInTheDocument();
    
    // Check logout button has proper accessibility
    const logoutButton = screen.getByTestId('logout-button');
    expect(logoutButton).toHaveAttribute('type', 'button');
  });
});