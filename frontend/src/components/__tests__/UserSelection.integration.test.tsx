import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import UserSelection from '../UserSelection';
import { SavedUser } from '../../types/user';
import { GET_USER_BY_ID } from '../../apollo/queries';

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
    data: {
      user: mockValidUser
    }
  }
};

const invalidUserMock = {
  request: {
    query: GET_USER_BY_ID,
    variables: { id: 'user-123' }
  },
  result: {
    data: {
      user: null
    }
  }
};


describe('UserSelection Integration Tests', () => {
  const defaultProps = {
    savedUser: mockSavedUser,
    onSelectExistingUser: jest.fn(),
    onCreateNewUser: jest.fn(),
    onDeleteSavedUser: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with Apollo Client provider', async () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <UserSelection {...defaultProps} />
      </MockedProvider>
    );

    expect(screen.getByText('チャットに参加')).toBeInTheDocument();
    expect(screen.getByText('テストユーザー')).toBeInTheDocument();
  });

  it('should handle user validation flow (successful)', async () => {
    const onSelectExistingUser = jest.fn();

    render(
      <MockedProvider mocks={[validUserMock]} addTypename={false}>
        <UserSelection 
          {...defaultProps} 
          onSelectExistingUser={onSelectExistingUser}
        />
      </MockedProvider>
    );

    const existingUserButton = screen.getByTestId('select-existing-user-button');
    fireEvent.click(existingUserButton);

    expect(onSelectExistingUser).toHaveBeenCalledTimes(1);
  });

  it('should handle user validation flow (user not found)', async () => {
    const onSelectExistingUser = jest.fn();

    render(
      <MockedProvider mocks={[invalidUserMock]} addTypename={false}>
        <UserSelection 
          {...defaultProps} 
          onSelectExistingUser={onSelectExistingUser}
          error="ユーザーが見つかりませんでした"
        />
      </MockedProvider>
    );

    expect(screen.getByText('ユーザーが見つかりませんでした')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should handle localStorage operations through props', () => {
    const onDeleteSavedUser = jest.fn();

    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <UserSelection 
          {...defaultProps} 
          onDeleteSavedUser={onDeleteSavedUser}
        />
      </MockedProvider>
    );

    const deleteButton = screen.getByTestId('delete-saved-user-button');
    fireEvent.click(deleteButton);

    expect(onDeleteSavedUser).toHaveBeenCalledTimes(1);
  });

  it('should handle new user creation flow', () => {
    const onCreateNewUser = jest.fn();

    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <UserSelection 
          {...defaultProps} 
          onCreateNewUser={onCreateNewUser}
        />
      </MockedProvider>
    );

    const newUserButton = screen.getByTestId('create-new-user-button');
    fireEvent.click(newUserButton);

    expect(onCreateNewUser).toHaveBeenCalledTimes(1);
  });

  it('should display loading state correctly', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <UserSelection {...defaultProps} loading={true} />
      </MockedProvider>
    );

    expect(screen.getByText('確認中...')).toBeInTheDocument();
    
    const existingUserButton = screen.getByTestId('select-existing-user-button');
    const newUserButton = screen.getByTestId('create-new-user-button');
    const deleteButton = screen.getByTestId('delete-saved-user-button');

    expect(existingUserButton).toBeDisabled();
    expect(newUserButton).toBeDisabled();
    expect(deleteButton).toBeDisabled();
  });

  it('should handle API errors gracefully', async () => {
    const errorMock = {
      request: {
        query: GET_USER_BY_ID,
        variables: { id: 'user-123' }
      },
      error: new Error('Network error')
    };

    render(
      <MockedProvider mocks={[errorMock]} addTypename={false}>
        <UserSelection 
          {...defaultProps} 
          error="ネットワークエラーが発生しました"
        />
      </MockedProvider>
    );

    expect(screen.getByText('ネットワークエラーが発生しました')).toBeInTheDocument();
  });

  it('should display relative time correctly for recent activity', () => {
    const recentUser: SavedUser = {
      ...mockSavedUser,
      lastSeen: new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5 minutes ago
    };

    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <UserSelection {...defaultProps} savedUser={recentUser} />
      </MockedProvider>
    );

    expect(screen.getByText(/最後のログイン:/)).toBeInTheDocument();
    // Should show relative time in Japanese
    expect(screen.getByText(/分前/)).toBeInTheDocument();
  });

  it('should maintain component state during interaction', async () => {
    const onSelectExistingUser = jest.fn();
    const onCreateNewUser = jest.fn();

    render(
      <MockedProvider mocks={[validUserMock]} addTypename={false}>
        <UserSelection 
          {...defaultProps} 
          onSelectExistingUser={onSelectExistingUser}
          onCreateNewUser={onCreateNewUser}
        />
      </MockedProvider>
    );

    // Click existing user button
    fireEvent.click(screen.getByTestId('select-existing-user-button'));
    expect(onSelectExistingUser).toHaveBeenCalledTimes(1);

    // Click new user button
    fireEvent.click(screen.getByTestId('create-new-user-button'));
    expect(onCreateNewUser).toHaveBeenCalledTimes(1);

    // Component should still be functional
    expect(screen.getByText('テストユーザー')).toBeInTheDocument();
  });
});