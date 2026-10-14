import { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { WeddingSetupPage } from './WeddingSetupPage';

export function AppHomePage() {
  const { user, membership, wedding, signOut } = useAuth();
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

  if (!wedding || !membership) return <WeddingSetupPage />;

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
          Your wedding workspace is ready. Continue planning one feature at a
          time.
        </p>
        <div className="account-detail">
          <span>Your wedding</span>
          <strong>{wedding.title}</strong>
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
