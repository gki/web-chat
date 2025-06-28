import React, { useEffect, useRef, useCallback } from 'react';
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
  const containerRef = useRef(null);
  const lastMessageCountRef = useRef(0);

  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end'
      });
    }
  }, []);

  // Optimized scroll logic - only scroll if new messages are added
  useEffect(() => {
    const messageCount = messages.length;

    // Only scroll to bottom if new messages were added
    if (messageCount > lastMessageCountRef.current) {
      // For initial load or many new messages, scroll immediately
      if (lastMessageCountRef.current === 0 || messageCount - lastMessageCountRef.current > 5) {
        scrollToBottom(false);
      } else {
        // For single new messages, smooth scroll
        scrollToBottom(true);
      }
    }

    lastMessageCountRef.current = messageCount;
  }, [messages, scrollToBottom]);

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
      ref={containerRef}
      sx={{
        flex: '1 1 0',
        overflow: 'auto',
        p: 1,
        display: 'flex',
        flexDirection: 'column',
        scrollBehavior: 'smooth',
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(0,0,0,0.1)',
          borderRadius: '3px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '3px',
          '&:hover': {
            background: 'rgba(0,0,0,0.5)',
          },
        },
      }}
    >
      <List sx={{ py: 0, flexGrow: 1 }}>
        {messages.map((message, index) => {
          const isOwnMessage = message.user.id === currentUserId;
          const isLastMessage = index === messages.length - 1;
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
          } catch {
            console.warn('Invalid date for message:', message.id, message.createdAt);
            messageTime = '時刻不明';
          }

          return (
            <ListItem
              key={message.id}
              sx={{
                display: 'flex',
                justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                mb: isLastMessage ? 0 : 1,
                pb: isLastMessage ? 2 : 1,
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
                    flexShrink: 0,
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
                    minWidth: 0, // Allow text wrapping
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
                    sx={{
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.4
                    }}
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
      <div
        ref={messagesEndRef}
        style={{
          height: '1px',
          width: '100%',
          minHeight: '1px',
          flexShrink: 0
        }}
      />
    </Box>
  );
}

export default MessageList;