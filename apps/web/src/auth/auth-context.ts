import { createContext } from 'react';
import type { User } from '../api/auth';

export type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  signedOutFromLocationKey: string | null;
  setAuthenticatedUser(user: User): void;
  signOut(): Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
