import { useState } from 'react';
import { useAuth } from '../auth/useAuth';

export function AppHomePage() {
  const { user, signOut } = useAuth();
  const [error, setError] = useState('');
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleLogout() {
    setError('');
    setIsSigningOut(true);
    try {
      await signOut();
    } catch {
      setError('Unable to log out. Please try again.');
      setIsSigningOut(false);
    }
  }

  return (
    <main className="app-welcome-page">
      <header className="app-header">
        <div className="wordmark">
          <span className="wordmark-mark" aria-hidden="true">
            V
          </span>
          <span>Vivah</span>
        </div>
        <button
          className="button button-secondary button-small"
          onClick={handleLogout}
          disabled={isSigningOut}
        >
          {isSigningOut ? 'Logging out…' : 'Log out'}
        </button>
      </header>
      <section className="app-welcome-card">
        <span className="account-ready-mark" aria-hidden="true">
          ✓
        </span>
        <span className="section-eyebrow">Account ready</span>
        <h1>Welcome to Vivah, {user?.name}.</h1>
        <p>
          Your secure account is ready. Creating your wedding workspace will be
          the next development milestone.
        </p>
        <div className="account-detail">
          <span>Signed in as</span>
          <strong>{user?.email}</strong>
        </div>
        {error ? (
          <div className="form-alert" role="alert">
            {error}
          </div>
        ) : null}
      </section>
    </main>
  );
}
