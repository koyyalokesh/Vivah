import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Navigate, NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { ThemeSelector } from '../ui/ThemeSelector';

type AppShellProps = { children: ReactNode };

const availableLinks = [
  { label: 'Overview', to: '/app', icon: 'home', end: true },
  { label: 'Events', to: '/app/events', icon: 'events' },
  { label: 'Tasks', to: '/app/tasks', icon: 'tasks' },
  { label: 'Members', to: '/app/members', icon: 'members' },
  { label: 'Wedding details', to: '/app/wedding/edit', icon: 'wedding' },
] as const;

const plannedLinks = ['Guests', 'Vendors', 'Expenses', 'Gallery'];

function NavIcon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    home: (
      <>
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5.5 10v10h13V10M9 20v-6h6v6" />
      </>
    ),
    members: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 20v-2.5A4.5 4.5 0 0 1 8 13h2a4.5 4.5 0 0 1 4.5 4.5V20M16 5.5a3 3 0 0 1 0 5.8M17 14a4 4 0 0 1 3.5 4v2" />
      </>
    ),
    wedding: (
      <>
        <path d="M7 4v3M17 4v3M4 9h16M5 6h14a1 1 0 0 1 1 1v13H4V7a1 1 0 0 1 1-1Z" />
        <path d="m9.2 14 2.8 2.5 2.8-2.5a2 2 0 0 0-2.8-2.8 2 2 0 0 0-2.8 2.8Z" />
      </>
    ),
    events: (
      <>
        <path d="M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" />
        <path d="M8 12h3M8 16h8M14 12h2" />
      </>
    ),
    tasks: (
      <>
        <path d="M9 5h11M9 12h11M9 19h11" />
        <path d="m3.5 5 1.5 1.5L7.5 4M3.5 12 5 13.5 7.5 11M3.5 19 5 20.5 7.5 18" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </>
    ),
    close: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
    ),
    logout: (
      <>
        <path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" />
      </>
    ),
  };
  return (
    <svg className="workspace-icon" viewBox="0 0 24 24" aria-hidden="true">
      {paths[name] ?? paths.home}
    </svg>
  );
}

export function AppShell({ children }: AppShellProps) {
  const { user, membership, wedding, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      if (wasOpenRef.current) menuButtonRef.current?.focus();
      wasOpenRef.current = false;
      return;
    }

    wasOpenRef.current = true;
    const drawer = drawerRef.current;
    const focusableElements = drawer?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    const firstElement = focusableElements?.[0];
    const lastElement = focusableElements?.[focusableElements.length - 1];
    firstElement?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
        return;
      }

      if (event.key !== 'Tab' || !firstElement || !lastElement) return;
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const weddingName =
    wedding?.title ||
    (wedding
      ? `${wedding.brideName} & ${wedding.groomName}`
      : 'Wedding workspace');
  const initials =
    user?.name
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'V';

  async function handleLogout() {
    setLogoutError('');
    setIsSigningOut(true);
    try {
      await signOut();
    } catch {
      setLogoutError('Unable to log out. Please try again.');
      setIsSigningOut(false);
    }
  }

  if (!wedding || !membership) {
    return <Navigate to="/app" replace />;
  }

  const navigation = (
    <>
      <div className="workspace-brand">
        <span className="workspace-brand-mark">V</span>
        <span>Vivah</span>
      </div>
      <nav className="workspace-nav" aria-label="Wedding workspace">
        <span className="workspace-nav-label">Workspace</span>
        {availableLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={'end' in link ? link.end : false}
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              `workspace-nav-link${isActive ? ' is-active' : ''}`
            }
          >
            <NavIcon name={link.icon} />
            <span>{link.label}</span>
          </NavLink>
        ))}
        <span className="workspace-nav-label workspace-nav-label-planning">
          Planning
        </span>
        {plannedLinks.map((label) => (
          <div className="workspace-nav-link is-disabled" key={label}>
            <span className="workspace-nav-dot" />
            <span>{label}</span>
            <small>Soon</small>
          </div>
        ))}
      </nav>
    </>
  );

  return (
    <div className="workspace-layout">
      <aside className="workspace-sidebar">{navigation}</aside>
      {isOpen ? (
        <button
          className="workspace-scrim"
          aria-label="Close navigation"
          onClick={() => setIsOpen(false)}
        />
      ) : null}
      <aside
        ref={drawerRef}
        className={`workspace-mobile-drawer${isOpen ? ' is-open' : ''}`}
        aria-hidden={!isOpen}
        aria-label="Wedding workspace navigation"
        aria-modal="true"
        inert={!isOpen}
        role="dialog"
      >
        <button
          className="workspace-drawer-close"
          onClick={() => setIsOpen(false)}
          aria-label="Close navigation"
        >
          <NavIcon name="close" />
        </button>
        {navigation}
      </aside>
      <div className="workspace-main">
        <header className="workspace-topbar">
          <button
            ref={menuButtonRef}
            className="workspace-menu-button"
            onClick={() => setIsOpen(true)}
            aria-label="Open navigation"
          >
            <NavIcon name="menu" />
          </button>
          <div className="workspace-topbar-title">
            <strong>{weddingName}</strong>
          </div>
          <div className="workspace-theme-control">
            <ThemeSelector compact />
          </div>
          <div className="workspace-account">
            <span className="workspace-avatar">{initials}</span>
            <span className="workspace-account-copy">
              <span className="workspace-account-name">
                <strong>{user?.name}</strong>
                <small className="workspace-role-badge">
                  {membership?.role === 'ADMIN' ? 'Admin' : 'Manager'}
                </small>
              </span>
              <small>{user?.email}</small>
            </span>
            <button
              onClick={handleLogout}
              disabled={isSigningOut}
              aria-label="Log out"
              title="Log out"
            >
              <NavIcon name="logout" />
            </button>
          </div>
        </header>
        {logoutError ? (
          <div className="workspace-error" role="alert">
            {logoutError}
          </div>
        ) : null}
        <div className="workspace-content">{children}</div>
      </div>
    </div>
  );
}
