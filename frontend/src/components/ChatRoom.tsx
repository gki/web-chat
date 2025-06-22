import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Button,
} from '@mui/material';
import { ExitToApp } from '@mui/icons-material';
import { useQuery, useMutation, useApolloClient } from '@apollo/client';

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
  const client = useApolloClient();
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
    <Box sx={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" color="primary" sx={{ mb: 2 }}>
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

      <Grid container spacing={2} sx={{ flexGrow: 1, height: 0 }}>
        <Grid item xs={12} md={8}>
          <Paper
            elevation={1}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
              <MessageList
                messages={messagesData?.messages || []}
                loading={messagesLoading}
                error={messagesError}
                currentUserId={currentUser.id}
              />
            </Box>
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <MessageInput
                currentUser={currentUser}
                onMessageSent={handleMessageSent}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={1} sx={{ height: '100%', p: 2 }}>
            <Typography variant="h6" gutterBottom>
              オンラインユーザー
            </Typography>
            <UserList
              users={usersData?.users || []}
              loading={usersLoading}
              currentUserId={currentUser.id}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ChatRoom;