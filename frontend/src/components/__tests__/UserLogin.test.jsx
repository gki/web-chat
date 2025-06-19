import React from 'react';
import { render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';

import UserLogin from '../UserLogin';

const mockOnLogin = jest.fn();

describe('UserLogin', () => {
  beforeEach(() => {
    mockOnLogin.mockClear();
  });

  it('renders login form', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <UserLogin onLogin={mockOnLogin} />
      </MockedProvider>
    );

    expect(screen.getByRole('heading', { name: 'チャットに参加' })).toBeInTheDocument();
    expect(screen.getByTestId('name-input')).toBeInTheDocument();
    expect(screen.getByTestId('join-button')).toBeInTheDocument();
  });

  it('disables submit button when name is empty', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <UserLogin onLogin={mockOnLogin} />
      </MockedProvider>
    );

    const submitButton = screen.getByTestId('join-button');
    expect(submitButton).toBeDisabled();
  });
});