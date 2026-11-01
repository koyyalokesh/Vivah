import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  archiveEvent,
  eventTypeLabels,
  getEvent,
  type WeddingEvent,
} from '../api/events';
import { useAuth } from '../auth/useAuth';
import { formatEventDate, formatEventTime } from './event-time';

export function EventDetailsPage() {
  const { eventId = '' } = useParams();
  const navigate = useNavigate();
  const { wedding } = useAuth();
  const zone = wedding?.timeZone ?? 'UTC';
  const [event, setEvent] = useState<WeddingEvent | null>(null);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const archiveButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    getEvent(eventId)
      .then(setEvent)
      .catch(() => setError('This event could not be found.'));
  }, [eventId]);
  useEffect(() => {
    if (!confirming) return;
    const archiveButton = archiveButtonRef.current;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable?.[0];
    const last = focusable?.[focusable.length - 1];
    first?.focus();
    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape') {
        keyboardEvent.preventDefault();
        setConfirming(false);
        return;
      }
      if (keyboardEvent.key !== 'Tab' || !first || !last) return;
      if (keyboardEvent.shiftKey && document.activeElement === first) {
        keyboardEvent.preventDefault();
        last.focus();
      } else if (!keyboardEvent.shiftKey && document.activeElement === last) {
        keyboardEvent.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      archiveButton?.focus();
    };
  }, [confirming]);
  async function archive() {
    setArchiving(true);
    try {
      await archiveEvent(eventId);
      navigate('/app/events', { replace: true });
    } catch {
      setError('Unable to archive this event. Please try again.');
      setConfirming(false);
      setArchiving(false);
    }
  }
  if (error && !event)
    return (
      <main className="event-details-page">
        <Link className="event-back-link" to="/app/events">
          ← Back to events
        </Link>
        <section className="events-empty">
          <h1>Event unavailable</h1>
          <p>{error}</p>
        </section>
      </main>
    );
  if (!event)
    return (
      <main className="event-details-page">
        <p>Loading event…</p>
      </main>
    );
  return (
    <main className="event-details-page">
      <Link className="event-back-link" to="/app/events">
        ← Back to events
      </Link>
      <header className="event-detail-heading">
        <div>
          <div className="event-detail-badges">
            {event.type ? <span>{eventTypeLabels[event.type]}</span> : null}
            {event.archivedAt ? (
              <span className="event-archived-badge">Archived</span>
            ) : null}
          </div>
          <h1>{event.name}</h1>
          <p>{formatEventDate(event.startsAt, zone)}</p>
        </div>
        {!event.archivedAt ? (
          <div className="event-detail-actions">
            <Link
              className="button button-primary"
              to={`/app/events/${event.id}/edit`}
            >
              Edit event
            </Link>
            <button
              ref={archiveButtonRef}
              className="button button-secondary"
              onClick={() => setConfirming(true)}
            >
              Archive
            </button>
          </div>
        ) : null}
      </header>
      {error ? (
        <div className="form-error" role="alert">
          {error}
        </div>
      ) : null}
      <section className="event-detail-grid">
        <article className="event-detail-card">
          <span>Date & time</span>
          <h2>{formatEventDate(event.startsAt, zone)}</h2>
          <p>
            {formatEventTime(event.startsAt, zone)}
            {event.endsAt ? ` – ${formatEventTime(event.endsAt, zone)}` : ''}
          </p>
          <small>{zone}</small>
        </article>
        <article className="event-detail-card">
          <span>Venue</span>
          <h2>{event.venueName || 'Venue not set'}</h2>
          {event.address ? (
            <p>{event.address}</p>
          ) : (
            <small>Add a venue when the location is confirmed.</small>
          )}
        </article>
        {event.dressCode ? (
          <article className="event-detail-card">
            <span>Dress code</span>
            <h2>{event.dressCode}</h2>
          </article>
        ) : null}
      </section>
      {event.description ? (
        <section className="event-description">
          <span>About this event</span>
          <p>{event.description}</p>
        </section>
      ) : null}
      {event.archivedAt ? (
        <section className="event-archived-note">
          <strong>This event is archived</strong>
          <p>
            Its details are preserved, but it is hidden from active planning
            views.
          </p>
        </section>
      ) : null}
      {confirming ? (
        <div className="dialog-backdrop">
          <section
            ref={dialogRef}
            className="event-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="archive-title"
          >
            <span className="event-dialog-mark">◇</span>
            <h2 id="archive-title">Archive “{event.name}”?</h2>
            <p>
              The event will be hidden from active planning views, but its
              details and existing connections will be preserved.
            </p>
            <div>
              <button
                className="button button-secondary"
                disabled={archiving}
                onClick={() => setConfirming(false)}
              >
                Keep event
              </button>
              <button
                className="button button-danger"
                disabled={archiving}
                onClick={archive}
              >
                {archiving ? 'Archiving…' : 'Archive event'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
