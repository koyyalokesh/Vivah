import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError, getCurrentSession } from '../api/auth';
import {
  acceptMemberInvitation,
  getPublicMemberInvitation,
  type PublicMemberInvitation,
} from '../api/members';
import { useAuth } from '../auth/useAuth';
import { ThemeSelector } from '../components/ui/ThemeSelector';

export function MemberInvitationPage() {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const { user, setAuthenticatedSession, signOut } = useAuth();
  const [invitation, setInvitation] = useState<PublicMemberInvitation | null>(
    null,
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [switchingAccount, setSwitchingAccount] = useState(false);
  const path = `/member-invitations/${token}`;
  const isInvitedUser =
    user &&
    invitation &&
    user.email.trim().toLowerCase() === invitation.email.trim().toLowerCase();

  useEffect(() => {
    const existing = document.querySelector<HTMLMetaElement>(
      'meta[name="robots"]',
    );
    const previousContent = existing?.content;
    const robots = existing ?? document.createElement('meta');
    if (!existing) {
      robots.name = 'robots';
      document.head.append(robots);
    }
    robots.content = 'noindex, nofollow, noarchive';

    return () => {
      if (existing) robots.content = previousContent ?? '';
      else robots.remove();
    };
  }, []);

  useEffect(() => {
    void getPublicMemberInvitation(token)
      .then(setInvitation)
      .catch((caught) =>
        setError(
          caught instanceof ApiError
            ? caught.message
            : 'Unable to load this invitation.',
        ),
      )
      .finally(() => setLoading(false));
  }, [token]);

  async function accept() {
    setError('');
    setAccepting(true);
    try {
      await acceptMemberInvitation(token);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Unable to accept this invitation.',
      );
      setAccepting(false);
      return;
    }

    try {
      setAuthenticatedSession(await getCurrentSession());
      navigate('/app/members', { replace: true });
    } catch {
      window.location.replace('/app/members');
    }
  }

  async function switchToInvitedAccount() {
    setError('');
    setSwitchingAccount(true);
    try {
      await signOut();
    } catch {
      setError('Unable to sign out. Please try again.');
    } finally {
      setSwitchingAccount(false);
    }
  }

  return (
    <main className="invitation-page">
      <div className="invitation-theme-control">
        <ThemeSelector />
      </div>
      <section className="invitation-card">
        <div className="wordmark">Vivah</div>
        {loading ? (
          <p>Loading invitation…</p>
        ) : error && !invitation ? (
          <>
            <h1>Invitation unavailable</h1>
            <div className="form-alert" role="alert">
              {error}
            </div>
            <Link to="/" className="button button-secondary">
              Return home
            </Link>
          </>
        ) : invitation ? (
          <>
            <span className="section-eyebrow">Wedding invitation</span>
            <h1>You’re invited to help plan</h1>
            <h2>
              {invitation.wedding.brideName} &amp;{' '}
              {invitation.wedding.groomName}
            </h2>
            <p>
              This invitation is for <strong>{invitation.email}</strong> to join
              as {invitation.role === 'ADMIN' ? 'an Admin' : 'a Manager'}.
            </p>
            {error ? (
              <div className="form-alert" role="alert">
                {error}
              </div>
            ) : null}
            {isInvitedUser ? (
              <button
                className="button button-primary"
                disabled={accepting}
                onClick={() => void accept()}
              >
                {accepting ? 'Joining wedding…' : 'Accept invitation'}
              </button>
            ) : user ? (
              <div className="invitation-actions">
                <div className="form-notice" role="status">
                  You are signed in as <strong>{user.email}</strong>. This
                  invitation must be accepted using{' '}
                  <strong>{invitation.email}</strong>.
                </div>
                <button
                  className="button button-primary"
                  disabled={switchingAccount}
                  onClick={() => void switchToInvitedAccount()}
                >
                  {switchingAccount
                    ? 'Signing out…'
                    : 'Use the invited account'}
                </button>
              </div>
            ) : (
              <div className="invitation-actions">
                <Link
                  className="button button-primary"
                  to="/login"
                  state={{ from: path, invitedEmail: invitation.email }}
                >
                  Log in to accept
                </Link>
                <Link
                  className="button button-secondary"
                  to="/signup"
                  state={{ from: path, invitedEmail: invitation.email }}
                >
                  Create account
                </Link>
              </div>
            )}
          </>
        ) : null}
      </section>
    </main>
  );
}
