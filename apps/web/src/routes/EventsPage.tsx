import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventTypeLabels, getEvents, type WeddingEvent } from '../api/events';
import { useAuth } from '../auth/useAuth';
import { formatEventDate, formatEventTime } from './event-time';

export function EventsPage() {
  const { wedding } = useAuth();
  const timeZone = wedding?.timeZone ?? 'UTC';
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [archived, setArchived] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const load = useCallback(() => {
    getEvents(archived)
      .then((data) => {
        setEvents(archived ? data.filter((item) => item.archivedAt) : data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [archived]);
  useEffect(() => load(), [load]);
  return (
    <main className="events-page">
      <header className="events-heading">
        <div>
          <span className="section-eyebrow">Wedding schedule</span>
          <h1>Events</h1>
          <p>Plan every ceremony and celebration in one place.</p>
        </div>
        <Link className="button button-primary" to="/app/events/new">
          Add event
        </Link>
      </header>
      <div className="events-tabs">
        <button
          className={!archived ? 'is-active' : ''}
          onClick={() => {
            setStatus('loading');
            setArchived(false);
          }}
        >
          Upcoming & active
        </button>
        <button
          className={archived ? 'is-active' : ''}
          onClick={() => {
            setStatus('loading');
            setArchived(true);
          }}
        >
          Archived
        </button>
      </div>
      {status === 'loading' ? (
        <div className="events-list">
          {[1, 2, 3].map((item) => (
            <div className="event-card event-skeleton" key={item} />
          ))}
        </div>
      ) : null}
      {status === 'error' ? (
        <section className="events-empty">
          <span>!</span>
          <h2>We couldn’t load your events</h2>
          <p>Check your connection and try again.</p>
          <button
            className="button button-secondary"
            onClick={() => {
              setStatus('loading');
              load();
            }}
          >
            Try again
          </button>
        </section>
      ) : null}
      {status === 'ready' && !events.length ? (
        <section className="events-empty">
          <span className="events-empty-mark">◇</span>
          <h2>
            {archived ? 'No archived events' : 'Plan your first celebration'}
          </h2>
          <p>
            {archived
              ? 'Events you archive will remain available here.'
              : 'Add ceremonies and celebrations to build your wedding schedule.'}
          </p>
          {!archived ? (
            <Link className="button button-primary" to="/app/events/new">
              Add your first event
            </Link>
          ) : null}
        </section>
      ) : null}
      {status === 'ready' && events.length ? (
        <section className="events-list">
          {events.map((event) => (
            <Link
              className="event-card"
              to={`/app/events/${event.id}`}
              key={event.id}
            >
              <div className="event-date-tile">
                <strong>
                  {new Intl.DateTimeFormat('en-IN', {
                    day: '2-digit',
                    timeZone,
                  }).format(new Date(event.startsAt))}
                </strong>
                <span>
                  {new Intl.DateTimeFormat('en-IN', {
                    month: 'short',
                    timeZone,
                  }).format(new Date(event.startsAt))}
                </span>
              </div>
              <div className="event-card-main">
                <div className="event-card-title">
                  <h2>{event.name}</h2>
                  {event.type ? (
                    <span>{eventTypeLabels[event.type]}</span>
                  ) : null}
                  {event.archivedAt ? (
                    <span className="event-archived-badge">Archived</span>
                  ) : null}
                </div>
                <p>
                  {formatEventDate(event.startsAt, timeZone)} ·{' '}
                  {formatEventTime(event.startsAt, timeZone)}
                  {event.endsAt
                    ? `–${formatEventTime(event.endsAt, timeZone)}`
                    : ''}
                </p>
                {event.venueName ? (
                  <small>
                    {event.venueName}
                    {event.address ? ` · ${event.address}` : ''}
                  </small>
                ) : null}
              </div>
              <span className="event-card-arrow">›</span>
            </Link>
          ))}
        </section>
      ) : null}
    </main>
  );
}
