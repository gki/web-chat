import React from 'react';
import { render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';

import App from '../../App';

describe('App Integration', () => {
  it('shows login form initially', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <App />
      </MockedProvider>
    );

    expect(screen.getByText('チャットアプリ')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'チャットに参加' })).toBeInTheDocument();
    expect(screen.getByTestId('name-input')).toBeInTheDocument();
  });
});