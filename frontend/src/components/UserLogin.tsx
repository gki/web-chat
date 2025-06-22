import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
} from '@mui/material';
import { useMutation } from '@apollo/client';

import { CREATE_USER } from '../apollo/queries';
import { User } from '../types/user';

interface UserLoginProps {
  onLogin: (user: User) => void;
}

function UserLogin({ onLogin }: UserLoginProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const [createUser, { loading }] = useMutation(CREATE_USER, {
    onCompleted: (data) => {
      onLogin(data.createUser);
      setError('');
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('名前を入力してください');
      return;
    }

    try {
      await createUser({ variables: { name: name.trim() } });
    } catch (err) {
      // Error is handled by onError callback
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        maxWidth: 400,
        mx: 'auto',
      }}
    >
      <Typography variant="h5" component="h2">
        チャットに参加
      </Typography>

      {error && (
        <Alert severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        label="お名前"
        variant="outlined"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={loading}
        inputProps={{
          maxLength: 50,
          'data-testid': 'name-input',
        }}
        helperText="チャットで表示される名前を入力してください"
      />

      <Button
        type="submit"
        variant="contained"
        size="large"
        fullWidth
        disabled={loading || !name.trim()}
        data-testid="join-button"
      >
        {loading ? '参加中...' : 'チャットに参加'}
      </Button>
    </Box>
  );
}

export default UserLogin;