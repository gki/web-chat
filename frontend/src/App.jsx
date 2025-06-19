import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
} from '@mui/material';

import UserLogin from './components/UserLogin';
import ChatRoom from './components/ChatRoom';

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  const handleUserLogin = (user) => {
    setCurrentUser(user);
  };

  const handleUserLogout = () => {
    setCurrentUser(null);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, minHeight: '80vh' }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" gutterBottom>
            チャットアプリ
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            リアルタイムチャットを楽しもう
          </Typography>
        </Box>

        {!currentUser ? (
          <UserLogin onLogin={handleUserLogin} />
        ) : (
          <ChatRoom
            currentUser={currentUser}
            onLogout={handleUserLogout}
          />
        )}
      </Paper>
    </Container>
  );
}

export default App;