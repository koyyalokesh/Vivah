import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { ThemeSelector } from '../components/ui/ThemeSelector';
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
        <div className="app-header-actions">
          <ThemeSelector compact />
          <button
            className="button button-secondary button-small"
            onClick={handleLogout}
            disabled={isSigningOut}
          >
            {isSigningOut ? 'Logging out…' : 'Log out'}
          </button>
        </div>
      </header>
      <section className="app-welcome-card">
        <span className="account-ready-mark" aria-hidden="true">
          ✓
        </span>
        <span className="section-eyebrow">Wedding workspace</span>
        <h1>Welcome to Vivah, {user?.name}.</h1>
        <p>
          Your wedding workspace is ready. Use the available tools below while
          we build the remaining planning features one at a time.
        </p>
        <div className="account-detail">
          <span>Your wedding</span>
          <strong>
            {wedding.title || `${wedding.brideName} & ${wedding.groomName}`}
          </strong>
        </div>
        <div className="app-action-grid">
          <Link className="app-action-card" to="/app/wedding/edit">
            <span className="app-action-icon" aria-hidden="true">
              ✎
            </span>
            <span>
              <strong>Edit wedding details</strong>
              <small>Names, date, location and description</small>
            </span>
            <span aria-hidden="true">→</span>
          </Link>
          <Link className="app-action-card" to="/app/members">
            <span className="app-action-icon" aria-hidden="true">
              ◎
            </span>
            <span>
              <strong>Wedding members</strong>
              <small>
                {membership.role === 'ADMIN'
                  ? 'Invite people and manage access'
                  : 'View the people planning this wedding'}
              </small>
            </span>
            <span aria-hidden="true">→</span>
          </Link>
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
