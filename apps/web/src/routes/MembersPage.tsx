import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { ApiError, getCurrentSession } from '../api/auth';
import {
  getMemberInvitations,
  getMembers,
  inviteMember,
  removeMember,
  revokeMemberInvitation,
  updateMemberRole,
  type MemberInvitation,
  type MemberRole,
  type WeddingMember,
} from '../api/members';
import { useAuth } from '../auth/useAuth';
import { ThemeSelector } from '../components/ui/ThemeSelector';

type PendingConfirmation =
  | { type: 'REMOVE_MEMBER'; member: WeddingMember }
  | { type: 'REVOKE_INVITATION'; invitation: MemberInvitation };

export function MembersPage() {
  const navigate = useNavigate();
  const { membership, user, setAuthenticatedSession } = useAuth();
  const isAdmin = membership?.role === 'ADMIN';
  const [members, setMembers] = useState<WeddingMember[]>([]);
  const [invitations, setInvitations] = useState<MemberInvitation[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MemberRole>('MANAGER');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [confirmation, setConfirmation] = useState<PendingConfirmation | null>(
    null,
  );

  const load = useCallback(async () => {
    try {
      const [memberValues, invitationValues] = await Promise.all([
        getMembers(),
        isAdmin ? getMemberInvitations() : Promise.resolve([]),
      ]);
      setMembers(memberValues);
      setInvitations(invitationValues);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Unable to load wedding members.',
      );
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  // Loading remote route data on mount intentionally updates component state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => void load(), [load]);

  useEffect(() => {
    if (!confirmation) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setConfirmation(null);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [confirmation]);

  async function submitInvite(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setBusy('invite');
    try {
      await inviteMember({ email, role });
      setEmail('');
      setShowInviteForm(false);
      setSuccess(`Invitation sent to ${email.trim()}.`);
      await load();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Unable to send the invitation.',
      );
    } finally {
      setBusy('');
    }
  }

  async function changeRole(member: WeddingMember, nextRole: MemberRole) {
    setError('');
    setSuccess('');
    setBusy(member.membershipId);
    try {
      const updated = await updateMemberRole(member.membershipId, nextRole);
      setMembers((current) =>
        current.map((item) =>
          item.membershipId === updated.membershipId ? updated : item,
        ),
      );
      if (member.user.id === user?.id) {
        try {
          setAuthenticatedSession(await getCurrentSession());
        } catch {
          window.location.replace('/app/members');
          return;
        }
      }
      setSuccess(
        `${updated.user.name} is now ${nextRole === 'ADMIN' ? 'an Admin' : 'a Manager'}.`,
      );
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Unable to change this role.',
      );
    } finally {
      setBusy('');
    }
  }

  async function remove(member: WeddingMember) {
    setError('');
    setSuccess('');
    setBusy(member.membershipId);
    try {
      await removeMember(member.membershipId);
      setMembers((current) =>
        current.filter((item) => item.membershipId !== member.membershipId),
      );
      if (member.user.id === user?.id) {
        try {
          setAuthenticatedSession(await getCurrentSession());
        } catch {
          window.location.replace('/app');
          return;
        }
        navigate('/app', { replace: true });
      }
      setSuccess(`${member.user.name} was removed.`);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Unable to remove this member.',
      );
    } finally {
      setBusy('');
    }
  }

  async function revoke(invitation: MemberInvitation) {
    setError('');
    setSuccess('');
    setBusy(invitation.id);
    try {
      await revokeMemberInvitation(invitation.id);
      setInvitations((current) =>
        current.filter((item) => item.id !== invitation.id),
      );
      setSuccess(`Invitation for ${invitation.email} was revoked.`);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Unable to revoke this invitation.',
      );
    } finally {
      setBusy('');
    }
  }

  function confirmPendingAction() {
    const pending = confirmation;
    if (!pending) return;
    setConfirmation(null);
    if (pending.type === 'REMOVE_MEMBER') {
      void remove(pending.member);
      return;
    }
    void revoke(pending.invitation);
  }

  const confirmationContent = confirmation
    ? confirmation.type === 'REMOVE_MEMBER'
      ? {
          title: `Remove ${confirmation.member.user.name}?`,
          description:
            'They will immediately lose access to this wedding and its private planning information.',
          action: 'Remove member',
        }
      : {
          title: 'Revoke this invitation?',
          description: `${confirmation.invitation.email} will no longer be able to use this invitation link to join the wedding.`,
          action: 'Revoke invitation',
        }
    : null;

  return (
    <main className="members-page">
      <header className="members-header">
        <Link to="/app" className="edit-back">
          <span aria-hidden="true">←</span>
          <span className="wordmark">Vivah</span>
          <small>Wedding overview</small>
        </Link>
        <div className="members-header-actions">
          <ThemeSelector compact />
          <span>{user?.name}</span>
        </div>
      </header>
      <div className="members-shell">
        <div className="members-heading">
          <span className="section-eyebrow">Wedding settings</span>
          <h1>Wedding members</h1>
          <p>
            See everyone helping with this wedding
            {isAdmin ? ' and manage their access' : ''}.
          </p>
        </div>
        {error ? (
          <div className="form-alert" role="alert">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="form-success" role="status">
            {success}
          </div>
        ) : null}
        <section className="members-card" aria-labelledby="members-heading">
          <div className="members-card-heading">
            <div>
              <h2 id="members-heading">Current members</h2>
              <p>
                {loading
                  ? 'Loading wedding access…'
                  : `${members.length} ${members.length === 1 ? 'person has' : 'people have'} access to this wedding.`}
              </p>
            </div>
            {isAdmin ? (
              <button
                className="button button-primary button-small"
                type="button"
                aria-expanded={showInviteForm}
                onClick={() => setShowInviteForm((visible) => !visible)}
              >
                {showInviteForm ? 'Close' : 'Invite member'}
              </button>
            ) : null}
          </div>
          {isAdmin && showInviteForm ? (
            <form className="member-invite-form" onSubmit={submitInvite}>
              <label>
                Email address
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="family@example.com"
                  autoFocus
                  required
                />
              </label>
              <label>
                Role
                <select
                  value={role}
                  onChange={(event) =>
                    setRole(event.target.value as MemberRole)
                  }
                >
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </label>
              <button
                className="button button-primary"
                disabled={busy === 'invite'}
              >
                {busy === 'invite' ? 'Sending…' : 'Send invitation'}
              </button>
            </form>
          ) : null}
          {loading ? (
            <p className="member-empty" role="status">
              Loading members…
            </p>
          ) : (
            <div className="member-list">
              {members.map((member) => (
                <article className="member-row" key={member.membershipId}>
                  <div className="member-avatar" aria-hidden="true">
                    {member.user.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <strong>
                      {member.user.name}
                      {member.user.id === user?.id ? ' (You)' : ''}
                    </strong>
                    <span>{member.user.email}</span>
                  </div>
                  <span
                    className={`role-badge role-badge-${member.role.toLowerCase()}`}
                  >
                    {member.role}
                  </span>
                  {isAdmin ? (
                    <div className="member-actions">
                      <button
                        className="button button-secondary button-small"
                        disabled={busy === member.membershipId}
                        onClick={() =>
                          void changeRole(
                            member,
                            member.role === 'ADMIN' ? 'MANAGER' : 'ADMIN',
                          )
                        }
                      >
                        {member.role === 'ADMIN'
                          ? 'Make Manager'
                          : 'Make Admin'}
                      </button>
                      <button
                        className="button button-danger button-small"
                        disabled={busy === member.membershipId}
                        onClick={() =>
                          setConfirmation({ type: 'REMOVE_MEMBER', member })
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
        {isAdmin ? (
          <section className="members-card" aria-labelledby="pending-heading">
            <div className="members-card-heading">
              <div>
                <h2 id="pending-heading">Pending invitations</h2>
                <p>Invitations waiting to be accepted.</p>
              </div>
              {invitations.length ? (
                <span className="members-count">{invitations.length}</span>
              ) : null}
            </div>
            {loading ? (
              <p className="member-empty" role="status">
                Loading invitations…
              </p>
            ) : invitations.length ? (
              <div className="member-list">
                {invitations.map((invitation) => (
                  <article
                    className="member-row invitation-row"
                    key={invitation.id}
                  >
                    <div>
                      <strong>{invitation.email}</strong>
                      <span>
                        Expires{' '}
                        {new Date(invitation.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span
                      className={`role-badge role-badge-${invitation.role.toLowerCase()}`}
                    >
                      {invitation.role}
                    </span>
                    <button
                      className="button button-secondary button-small"
                      disabled={busy === invitation.id}
                      onClick={() =>
                        setConfirmation({
                          type: 'REVOKE_INVITATION',
                          invitation,
                        })
                      }
                    >
                      Revoke
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <p className="member-empty">No pending invitations.</p>
            )}
          </section>
        ) : null}
      </div>
      {confirmationContent ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setConfirmation(null)}
        >
          <section
            className="confirmation-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmation-title"
            aria-describedby="confirmation-description"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="dialog-icon" aria-hidden="true">
              !
            </span>
            <h2 id="confirmation-title">{confirmationContent.title}</h2>
            <p id="confirmation-description">
              {confirmationContent.description}
            </p>
            <div>
              <button
                className="button button-secondary"
                type="button"
                autoFocus
                onClick={() => setConfirmation(null)}
              >
                Cancel
              </button>
              <button
                className="button button-danger"
                type="button"
                onClick={confirmPendingAction}
              >
                {confirmationContent.action}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
