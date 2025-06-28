import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import MessageList from '../MessageList';

const mockMessages = [
  {
    id: 'msg-1',
    content: 'Hello World',
    createdAt: '2023-12-01T10:00:00Z',
    user: {
      id: 'user-1',
      name: 'Alice'
    }
  },
  {
    id: 'msg-2',
    content: 'How are you?',
    createdAt: '2023-12-01T10:01:00Z',
    user: {
      id: 'user-2', 
      name: 'Bob'
    }
  },
  {
    id: 'msg-3',
    content: 'Fine, thanks!',
    createdAt: '2023-12-01T10:02:00Z',
    user: {
      id: 'user-1',
      name: 'Alice'
    }
  }
];

const defaultProps = {
  messages: mockMessages,
  loading: false,
  error: null,
  currentUserId: 'user-1'
};

// Mock scrollIntoView
const mockScrollIntoView = jest.fn();
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  configurable: true,
  value: mockScrollIntoView,
});

describe('MessageList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders messages correctly', () => {
    render(<MessageList {...defaultProps} />);

    expect(screen.getByTestId('message-msg-1')).toHaveTextContent('Hello World');
    expect(screen.getByTestId('message-msg-2')).toHaveTextContent('How are you?');
    expect(screen.getByTestId('message-msg-3')).toHaveTextContent('Fine, thanks!');
  });

  it('distinguishes between own and other messages', () => {
    render(<MessageList {...defaultProps} />);

    // User's own messages (user-1)
    const ownMessage1 = screen.getByTestId('message-msg-1').closest('li');
    const ownMessage3 = screen.getByTestId('message-msg-3').closest('li');
    
    // Other user's messages (user-2)
    const otherMessage = screen.getByTestId('message-msg-2').closest('li');

    expect(ownMessage1).toHaveStyle('justify-content: flex-end');
    expect(ownMessage3).toHaveStyle('justify-content: flex-end');
    expect(otherMessage).toHaveStyle('justify-content: flex-start');
  });

  it('displays loading state', () => {
    render(<MessageList {...defaultProps} loading={true} messages={[]} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays error state', () => {
    const error = { message: 'Failed to load messages' };
    render(<MessageList {...defaultProps} error={error} />);

    expect(screen.getByText(/Failed to load messages/)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('displays empty state when no messages', () => {
    render(<MessageList {...defaultProps} messages={[]} />);

    expect(screen.getByText(/まだメッセージがありません/)).toBeInTheDocument();
  });

  it('formats message timestamps correctly', () => {
    render(<MessageList {...defaultProps} />);

    // Should display time in HH:mm format
    expect(screen.getByText(/Alice • 19:00/)).toBeInTheDocument();
    expect(screen.getByText(/Bob • 19:01/)).toBeInTheDocument();
    expect(screen.getByText(/Alice • 19:02/)).toBeInTheDocument();
  });

  it('handles invalid timestamps gracefully', () => {
    const messagesWithInvalidDate = [
      {
        id: 'msg-invalid',
        content: 'Invalid date message',
        createdAt: 'invalid-date',
        user: { id: 'user-1', name: 'Alice' }
      }
    ];

    render(<MessageList {...defaultProps} messages={messagesWithInvalidDate} />);

    expect(screen.getByTestId('message-msg-invalid')).toHaveTextContent('Invalid date message');
    // For invalid dates, no time should be displayed, just the username
    expect(screen.getByText('Alice •')).toBeInTheDocument();
  });

  it('auto-scrolls to bottom on initial load', async () => {
    render(<MessageList {...defaultProps} />);

    await waitFor(() => {
      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: 'auto',
        block: 'end'
      });
    });
  });

  it('smooth scrolls when new single message is added', async () => {
    const { rerender } = render(<MessageList {...defaultProps} />);

    // Clear initial scroll calls
    mockScrollIntoView.mockClear();

    // Add a new message
    const newMessage = {
      id: 'msg-4',
      content: 'New message',
      createdAt: '2023-12-01T10:03:00Z',
      user: { id: 'user-2', name: 'Bob' }
    };

    rerender(<MessageList {...defaultProps} messages={[...mockMessages, newMessage]} />);

    await waitFor(() => {
      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'end'
      });
    });
  });

  it('immediately scrolls when many messages are added', async () => {
    const { rerender } = render(<MessageList {...defaultProps} />);

    // Clear initial scroll calls
    mockScrollIntoView.mockClear();

    // Add many messages (more than 5)
    const manyNewMessages = Array.from({ length: 10 }, (_, i) => ({
      id: `msg-new-${i}`,
      content: `Message ${i}`,
      createdAt: '2023-12-01T10:03:00Z',
      user: { id: 'user-2', name: 'Bob' }
    }));

    rerender(<MessageList {...defaultProps} messages={[...mockMessages, ...manyNewMessages]} />);

    await waitFor(() => {
      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: 'auto',
        block: 'end'
      });
    });
  });

  it('applies correct styling for scroll behavior', () => {
    render(<MessageList {...defaultProps} />);

    // Check that the main container has proper structure
    const messageElement = screen.getByTestId('message-msg-1');
    expect(messageElement).toBeInTheDocument();
    
    // Check that the list container exists
    const listContainer = messageElement.closest('ul');
    expect(listContainer).toBeInTheDocument();
    expect(listContainer).toHaveClass('MuiList-root');
  });

  it('renders user avatars with correct initials', () => {
    render(<MessageList {...defaultProps} />);

    const avatars = screen.getAllByText(/^[AB]$/);
    expect(avatars).toHaveLength(3); // Alice (2) + Bob (1)
    
    // Check specific avatars
    expect(screen.getAllByText('A')).toHaveLength(2); // Alice's messages
    expect(screen.getAllByText('B')).toHaveLength(1); // Bob's message
  });

  it('handles long message content with proper text wrapping', () => {
    const longMessage = {
      id: 'msg-long',
      content: 'This is a very long message that should wrap properly and not overflow the container boundaries when displayed in the chat interface',
      createdAt: '2023-12-01T10:00:00Z',
      user: { id: 'user-1', name: 'Alice' }
    };

    render(<MessageList {...defaultProps} messages={[longMessage]} />);

    const messageContent = screen.getByTestId('message-msg-long');
    expect(messageContent).toHaveStyle('word-break: break-word');
    expect(messageContent).toHaveStyle('white-space: pre-wrap');
  });

  it('preserves scroll position when messages update without new ones', async () => {
    const { rerender } = render(<MessageList {...defaultProps} />);

    // Clear initial scroll calls
    mockScrollIntoView.mockClear();

    // Re-render with same messages (e.g., message update without new messages)
    rerender(<MessageList {...defaultProps} messages={mockMessages} />);

    // Should not scroll when message count doesn't change
    await waitFor(() => {
      expect(mockScrollIntoView).not.toHaveBeenCalled();
    }, { timeout: 100 });
  });
});