import React from 'react';
import { render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';

import MessageInput from '../MessageInput';

const mockOnMessageSent = jest.fn();
const mockCurrentUser = {
  id: '1',
  name: 'Test User',
};

describe('MessageInput', () => {
  beforeEach(() => {
    mockOnMessageSent.mockClear();
  });

  it('renders message input form', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <MessageInput currentUser={mockCurrentUser} onMessageSent={mockOnMessageSent} />
      </MockedProvider>
    );

    expect(screen.getByTestId('message-input')).toBeInTheDocument();
    expect(screen.getByTestId('send-button')).toBeInTheDocument();
  });

  it('disables send button when message is empty', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <MessageInput currentUser={mockCurrentUser} onMessageSent={mockOnMessageSent} />
      </MockedProvider>
    );

    const sendButton = screen.getByTestId('send-button');
    expect(sendButton).toBeDisabled();
  });
});