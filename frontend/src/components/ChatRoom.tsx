import React, { useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  AppBar,
  Toolbar,
  Button,
} from '@mui/material';
import { ExitToApp } from '@mui/icons-material';
import { useQuery, useMutation } from '@apollo/client';

import {
  GET_MESSAGES,
  GET_USERS,
  UPDATE_USER_LAST_SEEN,
} from '../apollo/queries';
// import { useMessageSubscription, useUserSubscription } from '../hooks/useSubscriptions';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import UserList from './UserList';
import { User } from '../types/user';

interface ChatRoomProps {
  currentUser: User;
  onLogout: () => void;
}

function ChatRoom({ currentUser, onLogout }: ChatRoomProps) {
  const [updateUserLastSeen] = useMutation(UPDATE_USER_LAST_SEEN);

  // Set up subscriptions (temporarily disabled)
  // useMessageSubscription(client);
  // useUserSubscription(client);

  const {
    data: messagesData,
    loading: messagesLoading,
    error: messagesError,
    refetch: refetchMessages,
  } = useQuery(GET_MESSAGES, {
    pollInterval: 1000, // Poll messages every second
  });

  const {
    data: usersData,
    loading: usersLoading,
    refetch: refetchUsers,
  } = useQuery(GET_USERS, {
    pollInterval: 5000, // Poll users every 5 seconds
  });

  // Update user's last seen timestamp periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await updateUserLastSeen({
          variables: { id: currentUser.id },
        });
      } catch (error) {
        console.error('Failed to update last seen:', error);
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [currentUser.id, updateUserLastSeen]);

  const handleMessageSent = () => {
    // Refetch messages and users after sending
    refetchMessages();
    refetchUsers();
  };

  const handleLogout = () => {
    onLogout();
  };

  return (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <AppBar position="static" color="primary" sx={{ mb: 2, flexShrink: 0 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            チャットルーム - {currentUser.name}
          </Typography>
          <Button
            color="inherit"
            startIcon={<ExitToApp />}
            onClick={handleLogout}
            data-testid="logout-button"
          >
            退出
          </Button>
        </Toolbar>
      </AppBar>

      <Grid
        container
        spacing={2}
        sx={{
          flexGrow: 1,
          height: 0,
          minHeight: 0,
          overflow: 'hidden'
        }}
      >
        <Grid item xs={12} md={8} sx={{ height: '100%', display: 'flex' }}>
          <Paper
            elevation={1}
            sx={{
              height: '100%',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <Box sx={{
              flexGrow: 1,
              overflow: 'hidden',
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column'
            }}>
              <MessageList
                messages={messagesData?.messages || []}
                loading={messagesLoading}
                error={messagesError}
                currentUserId={currentUser.id}
              />
            </Box>
            <Box sx={{
              p: 2,
              borderTop: 1,
              borderColor: 'divider',
              flexShrink: 0
            }}>
              <MessageInput
                currentUser={currentUser}
                onMessageSent={handleMessageSent}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4} sx={{ height: '100%', display: 'flex' }}>
          <Paper
            elevation={1}
            sx={{
              height: '100%',
              width: '100%',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ flexShrink: 0 }}>
              オンラインユーザー
            </Typography>
            <Box sx={{ flexGrow: 1, overflow: 'auto', minHeight: 0 }}>
              <UserList
                users={usersData?.users || []}
                loading={usersLoading}
                currentUserId={currentUser.id}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ChatRoom;