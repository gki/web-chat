import React from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Chip,
  Box,
  CircularProgress,
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

function UserList({ users, loading, currentUserId }) {
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 200,
        }}
      >
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (users.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
        ユーザーがいません
      </Typography>
    );
  }

  return (
    <List sx={{ py: 0 }}>
      {users.map((user) => {
        const isCurrentUser = user.id === currentUserId;
        
        // Safely handle date conversion
        let lastSeenTime = 'オフライン';
        let isOnline = false;
        
        try {
          if (user.lastSeen) {
            const lastSeenDate = new Date(user.lastSeen);
            if (!isNaN(lastSeenDate.getTime())) {
              lastSeenTime = formatDistanceToNow(lastSeenDate, {
                addSuffix: true,
                locale: ja,
              });
              
              // Consider a user online if they were seen within the last 5 minutes
              isOnline = Date.now() - lastSeenDate.getTime() < 5 * 60 * 1000;
            }
          }
        } catch {
          console.warn('Invalid date for user:', user.id, user.lastSeen);
        }

        return (
          <ListItem
            key={user.id}
            sx={{ px: 0 }}
            data-testid={`user-${user.id}`}
          >
            <ListItemAvatar>
              <Avatar
                sx={{
                  bgcolor: isCurrentUser ? 'primary.main' : 'secondary.main',
                  width: 40,
                  height: 40,
                }}
              >
                {user.name.charAt(0)}
              </Avatar>
            </ListItemAvatar>
            
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" component="span">
                    {user.name}
                  </Typography>
                  {isCurrentUser && (
                    <Chip
                      label="あなた"
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {isOnline && !isCurrentUser && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'success.main',
                      }}
                    />
                  )}
                </Box>
              }
              secondary={
                <Typography variant="caption" color="text.secondary">
                  {isOnline ? 'オンライン' : lastSeenTime}
                </Typography>
              }
            />
          </ListItem>
        );
      })}
    </List>
  );
}

export default UserList;