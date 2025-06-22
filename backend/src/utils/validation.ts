import { UserInputError } from 'apollo-server-express';

export const validateUserName = (name: unknown): string => {
  if (!name || typeof name !== 'string') {
    throw new UserInputError('Name is required and must be a string');
  }
  
  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    throw new UserInputError('Name cannot be empty');
  }
  
  if (trimmedName.length > 50) {
    throw new UserInputError('Name cannot exceed 50 characters');
  }
  
  return trimmedName;
};

export const validateMessageContent = (content: unknown): string => {
  if (typeof content !== 'string') {
    throw new UserInputError('Message content is required and must be a string');
  }
  
  const trimmedContent = content.trim();
  if (trimmedContent.length === 0) {
    throw new UserInputError('Message content cannot be empty');
  }
  
  if (trimmedContent.length > 1000) {
    throw new UserInputError('Message content cannot exceed 1000 characters');
  }
  
  return trimmedContent;
};