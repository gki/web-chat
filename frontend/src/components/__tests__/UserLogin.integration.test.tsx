import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';

import UserLogin from '../UserLogin';
import { CREATE_USER } from '../../apollo/queries';

const mockOnLogin = jest.fn();

describe('UserLogin Integration Tests', () => {
  beforeEach(() => {
    mockOnLogin.mockClear();
  });

  it('should successfully create user and call onLogin with GraphQL integration', async () => {
    const user = userEvent.setup();
    
    const mocks = [
      {
        request: {
          query: CREATE_USER,
          variables: {
            name: 'Integration Test User',
          },
        },
        result: {
          data: {
            createUser: {
              id: 'user-123',
              name: 'Integration Test User',
              createdAt: '2023-01-01T12:00:00Z',
              lastSeen: '2023-01-01T12:00:00Z',
            },
          },
        },
        delay: 100, // Add delay to allow loading state to be visible
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <UserLogin onLogin={mockOnLogin} />
      </MockedProvider>
    );

    const nameInput = screen.getByTestId('name-input').querySelector('input');
    const joinButton = screen.getByTestId('join-button');

    // Initially button should be disabled
    expect(joinButton).toBeDisabled();

    // Type the user name
    await user.type(nameInput, 'Integration Test User');

    // Button should now be enabled
    expect(joinButton).not.toBeDisabled();

    // Submit the form
    await user.click(joinButton);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('参加中...')).toBeInTheDocument();
    });

    // Should call onLogin with the created user data
    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalledWith({
        id: 'user-123',
        name: 'Integration Test User',
        createdAt: '2023-01-01T12:00:00Z',
        lastSeen: '2023-01-01T12:00:00Z',
      });
    });

    // Loading state should be gone
    await waitFor(() => {
      expect(screen.queryByText('参加中...')).not.toBeInTheDocument();
    });
  });

  it('should handle GraphQL errors and display error message', async () => {
    const user = userEvent.setup();
    
    const errorMock = [
      {
        request: {
          query: CREATE_USER,
          variables: {
            name: 'Error User',
          },
        },
        error: new Error('Name cannot be empty'),
      },
    ];

    render(
      <MockedProvider mocks={errorMock} addTypename={false}>
        <UserLogin onLogin={mockOnLogin} />
      </MockedProvider>
    );

    const nameInput = screen.getByTestId('name-input').querySelector('input');
    const joinButton = screen.getByTestId('join-button');

    await user.type(nameInput, 'Error User');
    await user.click(joinButton);

    // Should display the error message
    await waitFor(() => {
      expect(screen.getByText(/Name cannot be empty/)).toBeInTheDocument();
    });

    // onLogin should not have been called
    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  it('should handle GraphQL validation errors from server', async () => {
    const user = userEvent.setup();
    
    const validationErrorMock = [
      {
        request: {
          query: CREATE_USER,
          variables: {
            name: 'Invalid User',
          },
        },
        result: {
          errors: [
            {
              message: 'Name cannot exceed 50 characters',
              extensions: {
                code: 'BAD_USER_INPUT',
              },
            },
          ],
        },
      },
    ];

    render(
      <MockedProvider mocks={validationErrorMock} addTypename={false}>
        <UserLogin onLogin={mockOnLogin} />
      </MockedProvider>
    );

    const nameInput = screen.getByTestId('name-input').querySelector('input');
    const joinButton = screen.getByTestId('join-button');

    await user.type(nameInput, 'Invalid User');
    await user.click(joinButton);

    // Should display the validation error
    await waitFor(() => {
      expect(screen.getByText(/Name cannot exceed 50 characters/)).toBeInTheDocument();
    });

    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  it('should trim whitespace from input and create user correctly', async () => {
    const user = userEvent.setup();
    
    const mocks = [
      {
        request: {
          query: CREATE_USER,
          variables: {
            name: 'Trimmed User', // Should be trimmed by component
          },
        },
        result: {
          data: {
            createUser: {
              id: 'user-456',
              name: 'Trimmed User',
              createdAt: '2023-01-01T12:00:00Z',
              lastSeen: '2023-01-01T12:00:00Z',
            },
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <UserLogin onLogin={mockOnLogin} />
      </MockedProvider>
    );

    const nameInput = screen.getByTestId('name-input').querySelector('input');
    const joinButton = screen.getByTestId('join-button');

    // Type with extra whitespace
    await user.type(nameInput, '  Trimmed User  ');
    await user.click(joinButton);

    // Should successfully create user with trimmed name
    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalledWith({
        id: 'user-456',
        name: 'Trimmed User',
        createdAt: '2023-01-01T12:00:00Z',
        lastSeen: '2023-01-01T12:00:00Z',
      });
    });
  });

  it('should show client-side validation before making GraphQL request', async () => {
    const user = userEvent.setup();
    
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <UserLogin onLogin={mockOnLogin} />
      </MockedProvider>
    );

    const nameInput = screen.getByTestId('name-input').querySelector('input');

    // Try to submit with just spaces
    await user.type(nameInput, '   ');
    
    // Since the button becomes disabled with only spaces, we need to force submit
    fireEvent.submit(nameInput.closest('form'));

    // Should show client-side validation error
    await waitFor(() => {
      expect(screen.getByText('名前を入力してください')).toBeInTheDocument();
    });

    // GraphQL request should not have been made
    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  it('should handle network errors gracefully', async () => {
    const user = userEvent.setup();
    
    const networkErrorMock = [
      {
        request: {
          query: CREATE_USER,
          variables: {
            name: 'Network Test User',
          },
        },
        error: new Error('Network error'),
      },
    ];

    render(
      <MockedProvider mocks={networkErrorMock} addTypename={false}>
        <UserLogin onLogin={mockOnLogin} />
      </MockedProvider>
    );

    const nameInput = screen.getByTestId('name-input').querySelector('input');
    const joinButton = screen.getByTestId('join-button');

    await user.type(nameInput, 'Network Test User');
    await user.click(joinButton);

    // Should display network error
    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });

    expect(mockOnLogin).not.toHaveBeenCalled();
  });
});