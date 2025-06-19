import React, { useState } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Alert,
} from '@mui/material';
import { Send } from '@mui/icons-material';
import { useMutation } from '@apollo/client';

import { CREATE_MESSAGE } from '../apollo/queries';

function MessageInput({ currentUser, onMessageSent }) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [createMessage, { loading }] = useMutation(CREATE_MESSAGE, {
    onCompleted: () => {
      setMessage('');
      setError('');
      onMessageSent();
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('メッセージを入力してください');
      return;
    }

    try {
      await createMessage({
        variables: {
          content: message.trim(),
          userId: currentUser.id,
        },
      });
    } catch (err) {
      // Error is handled by onError callback
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'flex-end',
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="メッセージを入力..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
          inputProps={{
            maxLength: 1000,
            'data-testid': 'message-input',
          }}
          variant="outlined"
          size="small"
        />
        
        <IconButton
          type="submit"
          color="primary"
          disabled={loading || !message.trim()}
          data-testid="send-button"
          sx={{ mb: 0.5 }}
        >
          <Send />
        </IconButton>
      </Box>
    </Box>
  );
}

export default MessageInput;