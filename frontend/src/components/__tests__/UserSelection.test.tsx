import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import UserSelection from '../UserSelection';
import { SavedUser } from '../../types/user';

const mockSavedUser: SavedUser = {
  id: 'user-123',
  name: 'テストユーザー',
  lastSeen: '2023-12-01T10:00:00Z'
};

const defaultProps = {
  savedUser: mockSavedUser,
  onSelectExistingUser: jest.fn(),
  onCreateNewUser: jest.fn(),
  onDeleteSavedUser: jest.fn(),
};

describe('UserSelection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render saved user information', () => {
    render(<UserSelection {...defaultProps} />);

    expect(screen.getByText('チャットに参加')).toBeInTheDocument();
    expect(screen.getByText('前回のユーザー')).toBeInTheDocument();
    expect(screen.getByText('テストユーザー')).toBeInTheDocument();
    expect(screen.getByText(/最後のログイン:/)).toBeInTheDocument();
  });

  it('should display formatted last seen time', () => {
    const recentTime = new Date(Date.now() - 2 * 60 * 1000).toISOString(); // 2 minutes ago
    const recentUser: SavedUser = {
      ...mockSavedUser,
      lastSeen: recentTime
    };

    render(<UserSelection {...defaultProps} savedUser={recentUser} />);

    expect(screen.getByText(/最後のログイン:/)).toBeInTheDocument();
    // Should show relative time like "2分前"
    expect(screen.getByText(/分前/)).toBeInTheDocument();
  });

  it('should handle invalid last seen date gracefully', () => {
    const invalidUser: SavedUser = {
      ...mockSavedUser,
      lastSeen: 'invalid-date'
    };

    render(<UserSelection {...defaultProps} savedUser={invalidUser} />);

    expect(screen.getByText('最後のログイン: 不明')).toBeInTheDocument();
  });

  it('should call onSelectExistingUser when existing user button is clicked', () => {
    render(<UserSelection {...defaultProps} />);

    const existingUserButton = screen.getByTestId('select-existing-user-button');
    fireEvent.click(existingUserButton);

    expect(defaultProps.onSelectExistingUser).toHaveBeenCalledTimes(1);
  });

  it('should call onCreateNewUser when new user button is clicked', () => {
    render(<UserSelection {...defaultProps} />);

    const newUserButton = screen.getByTestId('create-new-user-button');
    fireEvent.click(newUserButton);

    expect(defaultProps.onCreateNewUser).toHaveBeenCalledTimes(1);
  });

  it('should call onDeleteSavedUser when delete button is clicked', () => {
    render(<UserSelection {...defaultProps} />);

    const deleteButton = screen.getByTestId('delete-saved-user-button');
    fireEvent.click(deleteButton);

    expect(defaultProps.onDeleteSavedUser).toHaveBeenCalledTimes(1);
  });

  it('should display error message when error prop is provided', () => {
    const errorMessage = 'ユーザーの検証に失敗しました';
    render(<UserSelection {...defaultProps} error={errorMessage} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should disable buttons and show loading state when loading', () => {
    render(<UserSelection {...defaultProps} loading={true} />);

    const existingUserButton = screen.getByTestId('select-existing-user-button');
    const newUserButton = screen.getByTestId('create-new-user-button');
    const deleteButton = screen.getByTestId('delete-saved-user-button');

    expect(existingUserButton).toBeDisabled();
    expect(newUserButton).toBeDisabled();
    expect(deleteButton).toBeDisabled();
    expect(screen.getByText('確認中...')).toBeInTheDocument();
  });

  it('should show user name in existing user button text', () => {
    render(<UserSelection {...defaultProps} />);

    expect(screen.getByText('テストユーザーさんでログイン')).toBeInTheDocument();
  });

  it('should display help text', () => {
    render(<UserSelection {...defaultProps} />);

    expect(screen.getByText(/前回のユーザーを選択すると/)).toBeInTheDocument();
    expect(screen.getByText(/新しいユーザーを作成すると/)).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<UserSelection {...defaultProps} />);

    const deleteButton = screen.getByTestId('delete-saved-user-button');
    expect(deleteButton).toHaveAttribute('aria-label', '保存されたユーザー情報を削除');
  });

  it('should display saved user card with proper test id', () => {
    render(<UserSelection {...defaultProps} />);

    expect(screen.getByTestId('saved-user-card')).toBeInTheDocument();
  });
});