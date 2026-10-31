import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { getMembers } from '../api/members';
import { getWeddingCountdown } from './dashboard-countdown';

const modules = [
  {
    title: 'Events',
    description: 'Build your wedding schedule',
    symbol: '◇',
    tone: 'rose',
  },
  {
    title: 'Tasks',
    description: 'Keep planning work on track',
    symbol: '✓',
    tone: 'blue',
  },
  {
    title: 'Guests',
    description: 'Organize guests and invitations',
    symbol: '◎',
    tone: 'green',
  },
  {
    title: 'Expenses',
    description: 'Track your wedding budget',
    symbol: '₹',
    tone: 'gold',
  },
];

export function DashboardPage() {
  const { user, membership, wedding } = useAuth();
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const countdown = getWeddingCountdown(
    wedding?.weddingDate,
    wedding?.timeZone,
  );

  useEffect(() => {
    let active = true;
    getMembers()
      .then((members) => {
        if (active) setMemberCount(members.length);
      })
      .catch(() => {
        if (active) setMemberCount(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const formattedDate = wedding?.weddingDate
    ? new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date(`${wedding.weddingDate}T00:00:00`))
    : 'Date not set';

  return (
    <main className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <span className="section-eyebrow">Wedding overview</span>
          <h1>Welcome back, {user?.name.split(' ')[0]}</h1>
          <p>Here is your planning workspace at a glance.</p>
        </div>
        <Link
          className="button button-secondary button-small"
          to="/app/wedding/edit"
        >
          Edit wedding details
        </Link>
      </div>
      <section className="dashboard-hero">
        <div>
          <span className="dashboard-hero-label">Your celebration</span>
          <h2>
            {wedding?.title || `${wedding?.brideName} & ${wedding?.groomName}`}
          </h2>
          <div className="dashboard-facts">
            <span>{formattedDate}</span>
            <span>
              {wedding?.location?.formattedAddress || 'Location not set'}
            </span>
          </div>
        </div>
        <div className="dashboard-countdown">
          <strong>
            {countdown.status === 'upcoming'
              ? countdown.days
              : countdown.status === 'today'
                ? '0'
                : countdown.status === 'past'
                  ? '✓'
                  : '—'}
          </strong>
          <span>
            {countdown.status === 'upcoming'
              ? countdown.days === 1
                ? 'day to go'
                : 'days to go'
              : countdown.status === 'today'
                ? 'Wedding day'
                : countdown.status === 'past'
                  ? 'Celebrated'
                  : 'Add a date'}
          </span>
        </div>
      </section>
      <section className="dashboard-summary" aria-label="Workspace summary">
        <div>
          <span>Planning team</span>
          <strong>{memberCount ?? '—'}</strong>
          <Link to="/app/members">View members</Link>
        </div>
        <div>
          <span>Your access</span>
          <strong>{membership?.role === 'ADMIN' ? 'Admin' : 'Manager'}</strong>
          <small>Wedding-level membership</small>
        </div>
        <div>
          <span>Timezone</span>
          <strong className="dashboard-summary-text">
            {wedding?.timeZone || 'Not set'}
          </strong>
          <small>Used for your schedule</small>
        </div>
      </section>
      <div className="dashboard-section-title">
        <div>
          <h2>Planning tools</h2>
          <p>We will activate each tool as its feature is completed.</p>
        </div>
      </div>
      <section className="dashboard-module-grid">
        {modules.map((module) => (
          <article className="dashboard-module" key={module.title}>
            <span className={`dashboard-module-icon is-${module.tone}`}>
              {module.symbol}
            </span>
            <div>
              <h3>{module.title}</h3>
              <p>{module.description}</p>
            </div>
            <span className="dashboard-coming-soon">Coming soon</span>
          </article>
        ))}
      </section>
      <section className="dashboard-lower-grid">
        <article className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h2>Upcoming events</h2>
              <p>Your wedding schedule will appear here.</p>
            </div>
          </div>
          <div className="dashboard-empty">
            <span>◇</span>
            <strong>No events yet</strong>
            <p>Event planning is the recommended next feature for Vivah.</p>
          </div>
        </article>
        <article className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h2>Open tasks</h2>
              <p>Assigned planning work will appear here.</p>
            </div>
          </div>
          <div className="dashboard-empty">
            <span>✓</span>
            <strong>No tasks yet</strong>
            <p>Tasks will follow after the event foundation is ready.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
