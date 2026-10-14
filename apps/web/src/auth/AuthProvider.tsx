import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { ApiError, getCurrentUser, logout, type User } from '../api/auth';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [signedOutFromLocationKey, setSignedOutFromLocationKey] = useState<
    string | null
  >(null);

  useEffect(() => {
    let active = true;

    void getCurrentUser()
      .then((currentUser) => {
        if (active) setUser(currentUser);
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
      user,
      isLoading,
      signedOutFromLocationKey,
      setAuthenticatedUser: (authenticatedUser: User) => {
        setSignedOutFromLocationKey(null);
        setUser(authenticatedUser);
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
        setUser(null);
      },
    }),
    [isLoading, location.key, signedOutFromLocationKey, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
