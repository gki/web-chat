import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
} from '@mui/material';
import { useQuery, useMutation } from '@apollo/client';

import UserLogin from './components/UserLogin';
import UserSelection from './components/UserSelection';
import ChatRoom from './components/ChatRoom';
import { User, SavedUser } from './types/user';
import { localStorage } from './utils/localStorage';
import { GET_USER_BY_ID, UPDATE_USER_LAST_SEEN } from './apollo/queries';

type AppState = 'selection' | 'login' | 'chat';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [savedUser, setSavedUser] = useState<SavedUser | null>(null);
  const [appState, setAppState] = useState<AppState>('login');
  const [userValidationError, setUserValidationError] = useState<string>('');

  // GraphQL hooks for user validation
  const { 
    refetch: getUserById, 
    loading: validatingUser 
  } = useQuery(GET_USER_BY_ID, {
    skip: true, // Skip automatic execution
  });

  const [updateUserLastSeen] = useMutation(UPDATE_USER_LAST_SEEN);

  // Initialize app state on mount
  useEffect(() => {
    const initializeApp = () => {
      if (!localStorage.isAvailable()) {
        setAppState('login');
        return;
      }

      const saved = localStorage.getLastUser();
      if (saved) {
        setSavedUser(saved);
        setAppState('selection');
      } else {
        setAppState('login');
      }
    };

    initializeApp();
  }, []);

  const handleSelectExistingUser = async () => {
    if (!savedUser) return;

    setUserValidationError('');
    
    try {
      // Validate that the user still exists
      const { data } = await getUserById({ id: savedUser.id });
      
      if (!data?.user) {
        setUserValidationError('このユーザーは存在しません。新しいユーザーを作成してください。');
        return;
      }

      // Update lastSeen
      await updateUserLastSeen({ variables: { id: savedUser.id } });

      // Set current user and transition to chat
      setCurrentUser(data.user);
      setAppState('chat');

      // Update saved user with current timestamp
      const updatedSavedUser: SavedUser = {
        ...savedUser,
        lastSeen: new Date().toISOString(),
      };
      localStorage.saveLastUser(updatedSavedUser);
      setSavedUser(updatedSavedUser);

    } catch (error) {
      console.error('Failed to validate user:', error);
      setUserValidationError('ユーザーの確認に失敗しました。しばらくしてから再試行してください。');
    }
  };

  const handleCreateNewUser = () => {
    setUserValidationError('');
    setAppState('login');
  };

  const handleDeleteSavedUser = () => {
    localStorage.removeLastUser();
    setSavedUser(null);
    setAppState('login');
  };

  const handleUserLogin = (user: User) => {
    // Save to localStorage
    const userToSave: SavedUser = {
      id: user.id,
      name: user.name,
      lastSeen: user.lastSeen,
    };
    localStorage.saveLastUser(userToSave);
    setSavedUser(userToSave);
    
    setCurrentUser(user);
    setAppState('chat');
  };

  const handleUserLogout = () => {
    setCurrentUser(null);
    
    // Return to selection if we have saved user, otherwise login
    if (savedUser) {
      setAppState('selection');
    } else {
      setAppState('login');
    }
  };

  const renderContent = () => {
    switch (appState) {
      case 'selection':
        return savedUser ? (
          <UserSelection
            savedUser={savedUser}
            onSelectExistingUser={handleSelectExistingUser}
            onCreateNewUser={handleCreateNewUser}
            onDeleteSavedUser={handleDeleteSavedUser}
            loading={validatingUser}
            error={userValidationError}
          />
        ) : (
          <UserLogin onLogin={handleUserLogin} />
        );
      
      case 'login':
        return <UserLogin onLogin={handleUserLogin} />;
      
      case 'chat':
        return currentUser ? (
          <ChatRoom
            currentUser={currentUser}
            onLogout={handleUserLogout}
          />
        ) : (
          <UserLogin onLogin={handleUserLogin} />
        );
      
      default:
        return <UserLogin onLogin={handleUserLogin} />;
    }
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

        {renderContent()}
      </Paper>
    </Container>
  );
}

export default App;