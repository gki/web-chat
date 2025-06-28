import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';

import MessageInput from '../MessageInput';
import { CREATE_MESSAGE } from '../../apollo/queries';

const mockOnMessageSent = jest.fn();
const mockCurrentUser = {
  id: 'user-123',
  name: 'Test User',
};

describe('MessageInput Integration Tests', () => {
  beforeEach(() => {
    mockOnMessageSent.mockClear();
  });

  it('should successfully create message and call onMessageSent with GraphQL integration', async () => {
    const user = userEvent.setup();
    
    const mocks = [
      {
        request: {
          query: CREATE_MESSAGE,
          variables: {
            content: 'Hello, integration test!',
            userId: 'user-123',
          },
        },
        result: {
          data: {
            createMessage: {
              id: 'message-456',
              content: 'Hello, integration test!',
              createdAt: '2023-01-01T12:30:00Z',
              user: {
                id: 'user-123',
                name: 'Test User',
              },
            },
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <MessageInput currentUser={mockCurrentUser} onMessageSent={mockOnMessageSent} />
      </MockedProvider>
    );

    const messageInput = screen.getByTestId('message-input');
    const sendButton = screen.getByTestId('send-button');

    // Initially button should be disabled
    expect(sendButton).toBeDisabled();

    // Type the message
    await user.type(messageInput, 'Hello, integration test!');

    // Button should now be enabled
    expect(sendButton).not.toBeDisabled();

    // Submit the message
    await user.click(sendButton);

    // Should call onMessageSent when mutation completes
    await waitFor(() => {
      expect(mockOnMessageSent).toHaveBeenCalled();
    });

    // Input should be cleared after successful submission
    await waitFor(() => {
      expect(messageInput.value).toBe('');
    });
  });

  it('should handle GraphQL errors and display error message', async () => {
    const user = userEvent.setup();
    
    const errorMock = [
      {
        request: {
          query: CREATE_MESSAGE,
          variables: {
            content: 'Error message',
            userId: 'user-123',
          },
        },
        error: new Error('Message content cannot be empty'),
      },
    ];

    render(
      <MockedProvider mocks={errorMock} addTypename={false}>
        <MessageInput currentUser={mockCurrentUser} onMessageSent={mockOnMessageSent} />
      </MockedProvider>
    );

    const messageInput = screen.getByTestId('message-input');
    const sendButton = screen.getByTestId('send-button');

    await user.type(messageInput, 'Error message');
    await user.click(sendButton);

    // Should display the error message
    await waitFor(() => {
      expect(screen.getByText(/Message content cannot be empty/)).toBeInTheDocument();
    });

    // onMessageSent should not have been called
    expect(mockOnMessageSent).not.toHaveBeenCalled();

    // Input should not be cleared on error
    expect(messageInput.value).toBe('Error message');
  });

  it('should handle Enter key submission with GraphQL integration', async () => {
    const user = userEvent.setup();
    
    const mocks = [
      {
        request: {
          query: CREATE_MESSAGE,
          variables: {
            content: 'Enter key message',
            userId: 'user-123',
          },
        },
        result: {
          data: {
            createMessage: {
              id: 'message-789',
              content: 'Enter key message',
              createdAt: '2023-01-01T12:45:00Z',
              user: {
                id: 'user-123',
                name: 'Test User',
              },
            },
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <MessageInput currentUser={mockCurrentUser} onMessageSent={mockOnMessageSent} />
      </MockedProvider>
    );

    const messageInput = screen.getByTestId('message-input');

    await user.type(messageInput, 'Enter key message');
    await user.keyboard('{Enter}');

    // Should submit message via Enter key
    await waitFor(() => {
      expect(mockOnMessageSent).toHaveBeenCalled();
    });

    // Input should be cleared
    await waitFor(() => {
      expect(messageInput.value).toBe('');
    });
  });

  it('should not submit on Shift+Enter and allow multiline input', async () => {
    const user = userEvent.setup();
    
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <MessageInput currentUser={mockCurrentUser} onMessageSent={mockOnMessageSent} />
      </MockedProvider>
    );

    const messageInput = screen.getByTestId('message-input');

    await user.type(messageInput, 'Line 1');
    await user.keyboard('{Shift>}{Enter}{/Shift}Line 2');

    // Should not submit
    expect(mockOnMessageSent).not.toHaveBeenCalled();
    
    // Should contain multiline content
    expect(messageInput.value).toContain('Line 1\nLine 2');
  });

  it('should trim whitespace and create message correctly', async () => {
    const user = userEvent.setup();
    
    const mocks = [
      {
        request: {
          query: CREATE_MESSAGE,
          variables: {
            content: 'Trimmed message', // Should be trimmed by component
            userId: 'user-123',
          },
        },
        result: {
          data: {
            createMessage: {
              id: 'message-101',
              content: 'Trimmed message',
              createdAt: '2023-01-01T13:00:00Z',
              user: {
                id: 'user-123',
                name: 'Test User',
              },
            },
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <MessageInput currentUser={mockCurrentUser} onMessageSent={mockOnMessageSent} />
      </MockedProvider>
    );

    const messageInput = screen.getByTestId('message-input');
    const sendButton = screen.getByTestId('send-button');

    // Type with extra whitespace
    await user.type(messageInput, '  Trimmed message  ');
    await user.click(sendButton);

    // Should successfully create message
    await waitFor(() => {
      expect(mockOnMessageSent).toHaveBeenCalled();
    });
  });

  it('should show client-side validation before making GraphQL request', async () => {
    const user = userEvent.setup();
    
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <MessageInput currentUser={mockCurrentUser} onMessageSent={mockOnMessageSent} />
      </MockedProvider>
    );

    const messageInput = screen.getByTestId('message-input');

    // Try to submit with just spaces
    await user.type(messageInput, '   ');
    
    // Since the button becomes disabled with only spaces, we need to force submit
    fireEvent.submit(messageInput.closest('form'));

    // Should show client-side validation error
    await waitFor(() => {
      expect(screen.getByText('メッセージを入力してください')).toBeInTheDocument();
    });

    // GraphQL request should not have been made
    expect(mockOnMessageSent).not.toHaveBeenCalled();
  });

  it('should handle GraphQL validation errors from server', async () => {
    const user = userEvent.setup();
    
    const validationErrorMock = [
      {
        request: {
          query: CREATE_MESSAGE,
          variables: {
            content: 'Too long message',
            userId: 'user-123',
          },
        },
        result: {
          errors: [
            {
              message: 'Message content cannot exceed 1000 characters',
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
        <MessageInput currentUser={mockCurrentUser} onMessageSent={mockOnMessageSent} />
      </MockedProvider>
    );

    const messageInput = screen.getByTestId('message-input');
    const sendButton = screen.getByTestId('send-button');

    await user.type(messageInput, 'Too long message');
    await user.click(sendButton);

    // Should display the validation error
    await waitFor(() => {
      expect(screen.getByText(/Message content cannot exceed 1000 characters/)).toBeInTheDocument();
    });

    expect(mockOnMessageSent).not.toHaveBeenCalled();
  });

  it('should handle loading state correctly during submission', async () => {
    const user = userEvent.setup();
    
    // Create a delayed mock to test loading state
    const delayedMock = [
      {
        request: {
          query: CREATE_MESSAGE,
          variables: {
            content: 'Loading test message',
            userId: 'user-123',
          },
        },
        result: {
          data: {
            createMessage: {
              id: 'message-loading',
              content: 'Loading test message',
              createdAt: '2023-01-01T13:15:00Z',
              user: {
                id: 'user-123',
                name: 'Test User',
              },
            },
          },
        },
        delay: 100, // Add delay to test loading state
      },
    ];

    render(
      <MockedProvider mocks={delayedMock} addTypename={false}>
        <MessageInput currentUser={mockCurrentUser} onMessageSent={mockOnMessageSent} />
      </MockedProvider>
    );

    const messageInput = screen.getByTestId('message-input');
    const sendButton = screen.getByTestId('send-button');

    await user.type(messageInput, 'Loading test message');
    await user.click(sendButton);

    // During loading, input and button should be disabled
    expect(messageInput).toBeDisabled();
    expect(sendButton).toBeDisabled();

    // After completion, should re-enable
    await waitFor(() => {
      expect(mockOnMessageSent).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(messageInput).not.toBeDisabled();
      expect(sendButton).toBeDisabled(); // Still disabled because input is empty
    });
  });
});