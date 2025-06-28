import React from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  Card,
  CardContent,
  IconButton,
} from '@mui/material';
import { PersonAdd, Login, Delete } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

import { SavedUser } from '../types/user';

interface UserSelectionProps {
  savedUser: SavedUser;
  onSelectExistingUser: () => void;
  onCreateNewUser: () => void;
  onDeleteSavedUser: () => void;
  loading?: boolean;
  error?: string;
}

function UserSelection({
  savedUser,
  onSelectExistingUser,
  onCreateNewUser,
  onDeleteSavedUser,
  loading = false,
  error,
}: UserSelectionProps) {
  const formatLastSeen = (lastSeenStr: string): string => {
    try {
      const lastSeen = new Date(lastSeenStr);
      return formatDistanceToNow(lastSeen, { 
        addSuffix: true, 
        locale: ja 
      });
    } catch {
      return '不明';
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        maxWidth: 500,
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

      <Card sx={{ width: '100%' }} data-testid="saved-user-card">
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" component="h3">
                前回のユーザー
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold', mt: 1 }}>
                {savedUser.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                最後のログイン: {formatLastSeen(savedUser.lastSeen)}
              </Typography>
            </Box>
            <IconButton
              onClick={onDeleteSavedUser}
              color="error"
              disabled={loading}
              data-testid="delete-saved-user-button"
              aria-label="保存されたユーザー情報を削除"
            >
              <Delete />
            </IconButton>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
        <Button
          variant="contained"
          size="large"
          fullWidth
          startIcon={<Login />}
          onClick={onSelectExistingUser}
          disabled={loading}
          data-testid="select-existing-user-button"
        >
          {loading ? '確認中...' : `${savedUser.name}さんでログイン`}
        </Button>

        <Button
          variant="outlined"
          size="large"
          fullWidth
          startIcon={<PersonAdd />}
          onClick={onCreateNewUser}
          disabled={loading}
          data-testid="create-new-user-button"
        >
          新しいユーザーでログイン
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
        前回のユーザーを選択すると、そのユーザーとしてチャットを続けられます。
        新しいユーザーを作成すると、前回の情報は上書きされます。
      </Typography>
    </Box>
  );
}

export default UserSelection;