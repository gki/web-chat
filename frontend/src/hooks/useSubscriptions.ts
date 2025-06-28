import { useEffect } from 'react';
import { useSubscription } from '@apollo/client';
import {
  MESSAGE_ADDED_SUBSCRIPTION,
  USER_JOINED_SUBSCRIPTION,
  GET_MESSAGES,
  GET_USERS,
} from '../apollo/queries';

export function useMessageSubscription(client) {
  const { data: messageData } = useSubscription(MESSAGE_ADDED_SUBSCRIPTION);

  useEffect(() => {
    if (messageData?.messageAdded) {
      // Update messages cache
      const existingMessages = client.readQuery({
        query: GET_MESSAGES,
      });

      if (existingMessages) {
        const newMessage = messageData.messageAdded;
        const isDuplicate = existingMessages.messages.some(
          msg => msg.id === newMessage.id
        );

        if (!isDuplicate) {
          client.writeQuery({
            query: GET_MESSAGES,
            data: {
              messages: [...existingMessages.messages, newMessage],
            },
          });
        }
      }
    }
  }, [messageData, client]);

  return messageData?.messageAdded;
}

export function useUserSubscription(client) {
  const { data: userData } = useSubscription(USER_JOINED_SUBSCRIPTION);

  useEffect(() => {
    if (userData?.userJoined) {
      // Update users cache
      try {
        const existingUsers = client.readQuery({
          query: GET_USERS,
        });

        if (existingUsers) {
          const newUser = userData.userJoined;
          const isDuplicate = existingUsers.users.some(
            user => user.id === newUser.id
          );

          if (!isDuplicate) {
            client.writeQuery({
              query: GET_USERS,
              data: {
                users: [newUser, ...existingUsers.users],
              },
            });
          }
        }
      } catch {
        // Query might not exist in cache yet, that's okay
        console.warn('Users query not in cache yet');
      }
    }
  }, [userData, client]);

  return userData?.userJoined;
}