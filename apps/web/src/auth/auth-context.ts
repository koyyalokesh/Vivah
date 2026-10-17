import { createContext } from 'react';
import type {
  AuthSession,
  User,
  Wedding,
  WeddingMembership,
} from '../api/auth';

export type AuthContextValue = {
  user: User | null;
  membership: WeddingMembership | null;
  wedding: Wedding | null;
  isLoading: boolean;
  signedOutFromLocationKey: string | null;
  setAuthenticatedSession(session: AuthSession): void;
  setWeddingContext(context: {
    membership: WeddingMembership;
    wedding: Wedding;
  }): void;
  setWedding(wedding: Wedding): void;
  expireSession(): void;
  signOut(): Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
