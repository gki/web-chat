export interface User {
  id: string;
  name: string;
  createdAt: string;
  lastSeen: string;
}

export interface SavedUser {
  id: string;
  name: string;
  lastSeen: string;
}

export interface Message {
  id: string;
  content: string;
  createdAt: string;
  user: User;
}