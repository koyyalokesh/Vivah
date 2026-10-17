import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ApiError,
  getCurrentSession,
  logout,
  type AuthSession,
} from '../api/auth';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [signedOutFromLocationKey, setSignedOutFromLocationKey] = useState<
    string | null
  >(null);

  useEffect(() => {
    let active = true;

    void getCurrentSession()
      .then((currentSession) => {
        if (active) setSession(currentSession);
      })
      .catch((error: unknown) => {
        if (!(error instanceof ApiError && error.status === 401)) {
          console.error('Unable to restore the current session.');
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      membership: session?.membership ?? null,
      wedding: session?.wedding ?? null,
      isLoading,
      signedOutFromLocationKey,
      setAuthenticatedSession: (authenticatedSession: AuthSession) => {
        setSignedOutFromLocationKey(null);
        setSession(authenticatedSession);
      },
      setWeddingContext: (context: {
        membership: NonNullable<AuthSession['membership']>;
        wedding: NonNullable<AuthSession['wedding']>;
      }) => {
        setSession((current) =>
          current ? { ...current, ...context } : current,
        );
      },
      setWedding: (wedding: NonNullable<AuthSession['wedding']>) => {
        setSession((current) => (current ? { ...current, wedding } : current));
      },
      expireSession: () => {
        setSignedOutFromLocationKey(null);
        setSession(null);
      },
      signOut: async () => {
        try {
          await logout();
        } catch (error) {
          if (!(error instanceof ApiError && error.status === 401)) {
            throw error;
          }
        }
        setSignedOutFromLocationKey(location.key);
        setSession(null);
      },
    }),
    [isLoading, location.key, session, signedOutFromLocationKey],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
