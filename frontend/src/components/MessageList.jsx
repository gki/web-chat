import React, { useEffect, useRef } from 'react';
import {
  Box,
  List,
  ListItem,
  Typography,
  Paper,
  Avatar,
  CircularProgress,
  Alert,
} from '@mui/material';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

function MessageList({ messages, loading, error, currentUserId }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (loading && messages.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          メッセージの読み込みに失敗しました: {error.message}
        </Alert>
      </Box>
    );
  }

  if (messages.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          color: 'text.secondary',
        }}
      >
        <Typography variant="body1">
          まだメッセージがありません。最初のメッセージを送信してみましょう！
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100%',
        overflow: 'auto',
        p: 1,
      }}
    >
      <List sx={{ py: 0 }}>
        {messages.map((message) => {
          const isOwnMessage = message.user.id === currentUserId;
          let messageTime = '';
          
          try {
            if (message.createdAt) {
              const createdAtDate = new Date(message.createdAt);
              if (!isNaN(createdAtDate.getTime())) {
                messageTime = format(createdAtDate, 'HH:mm', {
                  locale: ja,
                });
              }
            }
          } catch (error) {
            console.warn('Invalid date for message:', message.id, message.createdAt);
            messageTime = '時刻不明';
          }

          return (
            <ListItem
              key={message.id}
              sx={{
                display: 'flex',
                justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                mb: 1,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: isOwnMessage ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                  maxWidth: '70%',
                  gap: 1,
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: isOwnMessage ? 'primary.main' : 'secondary.main',
                    fontSize: '0.875rem',
                  }}
                >
                  {message.user.name.charAt(0)}
                </Avatar>

                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    bgcolor: isOwnMessage ? 'primary.50' : 'grey.100',
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 0.5 }}
                  >
                    {message.user.name} • {messageTime}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ wordBreak: 'break-word' }}
                    data-testid={`message-${message.id}`}
                  >
                    {message.content}
                  </Typography>
                </Paper>
              </Box>
            </ListItem>
          );
        })}
      </List>
      <div ref={messagesEndRef} />
    </Box>
  );
}

export default MessageList;