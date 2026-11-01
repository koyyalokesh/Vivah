import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  createEvent,
  eventTypeLabels,
  getEvent,
  updateEvent,
  type EventType,
} from '../api/events';
import { useAuth } from '../auth/useAuth';
import { localInputToIso, toLocalInput } from './event-time';
type State = {
  name: string;
  type: EventType | '';
  startsAt: string;
  endsAt: string;
  venueName: string;
  address: string;
  description: string;
  dressCode: string;
};
const empty: State = {
  name: '',
  type: '',
  startsAt: '',
  endsAt: '',
  venueName: '',
  address: '',
  description: '',
  dressCode: '',
};
export function EventFormPage() {
  const { eventId } = useParams();
  const editing = Boolean(eventId);
  const { wedding } = useAuth();
  const zone = wedding?.timeZone ?? 'UTC';
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [expectedUpdatedAt, setExpectedUpdatedAt] = useState('');
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!eventId) return;
    getEvent(eventId)
      .then((event) => {
        if (event.archivedAt)
          return navigate(`/app/events/${event.id}`, { replace: true });
        setForm({
          name: event.name,
          type: event.type ?? '',
          startsAt: toLocalInput(event.startsAt, zone),
          endsAt: toLocalInput(event.endsAt, zone),
          venueName: event.venueName ?? '',
          address: event.address ?? '',
          description: event.description ?? '',
          dressCode: event.dressCode ?? '',
        });
        setExpectedUpdatedAt(event.updatedAt);
        setLoading(false);
      })
      .catch(() => {
        setError('Unable to load this event.');
        setLoading(false);
      });
  }, [eventId, navigate, zone]);
  const change = (field: keyof State, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.startsAt) return setError('Choose a start date and time.');
    let startsAt: string;
    let endsAt: string | null;
    try {
      startsAt = localInputToIso(form.startsAt, zone);
      endsAt = form.endsAt ? localInputToIso(form.endsAt, zone) : null;
    } catch (conversionError) {
      return setError(
        conversionError instanceof Error
          ? conversionError.message
          : 'Choose a valid date and time.',
      );
    }
    if (endsAt && endsAt <= startsAt)
      return setError('End time must be after the start time.');
    setSaving(true);
    try {
      const input = {
        name: form.name,
        type: form.type || undefined,
        startsAt,
        endsAt,
        venueName: form.venueName || null,
        address: form.address || null,
        description: form.description || null,
        dressCode: form.dressCode || null,
      };
      const saved =
        editing && eventId
          ? await updateEvent(eventId, {
              ...input,
              type: form.type || null,
              expectedUpdatedAt,
            })
          : await createEvent(input);
      navigate(`/app/events/${saved.id}`, { replace: true });
    } catch {
      setError('Unable to save the event. Review the details and try again.');
      setSaving(false);
    }
  }
  if (loading)
    return (
      <main className="event-form-page">
        <p>Loading event…</p>
      </main>
    );
  return (
    <main className="event-form-page">
      <Link
        className="event-back-link"
        to={editing && eventId ? `/app/events/${eventId}` : '/app/events'}
      >
        ← Back to events
      </Link>
      <header>
        <span className="section-eyebrow">Wedding schedule</span>
        <h1>{editing ? 'Edit event' : 'Add event'}</h1>
        <p>
          {editing
            ? 'Update the ceremony details for your planning team.'
            : 'Add a ceremony or celebration to your wedding schedule.'}
        </p>
      </header>
      <form className="event-form" onSubmit={submit}>
        {error ? (
          <div className="form-error" role="alert">
            {error}
          </div>
        ) : null}
        <section>
          <h2>Event details</h2>
          <div className="event-form-grid">
            <label className="event-field">
              <span>
                Event name <b>*</b>
              </span>
              <input
                required
                maxLength={150}
                value={form.name}
                onChange={(e) => change('name', e.target.value)}
                placeholder="e.g. Mehendi"
              />
            </label>
            <label className="event-field">
              <span>Event type</span>
              <select
                value={form.type}
                onChange={(e) => change('type', e.target.value)}
              >
                <option value="">Select a type</option>
                {Object.entries(eventTypeLabels).map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>
        <section>
          <div className="event-section-heading">
            <h2>Date & time</h2>
            <small>Times shown in {zone}</small>
          </div>
          <div className="event-form-grid">
            <label className="event-field">
              <span>
                Starts <b>*</b>
              </span>
              <input
                required
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => change('startsAt', e.target.value)}
              />
            </label>
            <label className="event-field">
              <span>Ends</span>
              <input
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => change('endsAt', e.target.value)}
              />
            </label>
          </div>
        </section>
        <section>
          <h2>Venue</h2>
          <div className="event-form-grid">
            <label className="event-field">
              <span>Venue name</span>
              <input
                maxLength={200}
                value={form.venueName}
                onChange={(e) => change('venueName', e.target.value)}
                placeholder="e.g. Royal Garden"
              />
            </label>
            <label className="event-field">
              <span>Address</span>
              <input
                maxLength={500}
                value={form.address}
                onChange={(e) => change('address', e.target.value)}
                placeholder="City or full address"
              />
            </label>
          </div>
        </section>
        <section>
          <h2>Additional details</h2>
          <div className="event-form-grid">
            <label className="event-field event-field-wide">
              <span>Description</span>
              <textarea
                maxLength={2000}
                rows={4}
                value={form.description}
                onChange={(e) => change('description', e.target.value)}
                placeholder="Share useful details for your planning team"
              />
            </label>
            <label className="event-field">
              <span>Dress code</span>
              <input
                maxLength={200}
                value={form.dressCode}
                onChange={(e) => change('dressCode', e.target.value)}
                placeholder="e.g. Green / Traditional"
              />
            </label>
          </div>
        </section>
        <div className="event-form-actions">
          <Link
            className="button button-secondary"
            to={editing && eventId ? `/app/events/${eventId}` : '/app/events'}
          >
            Cancel
          </Link>
          <button className="button button-primary" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create event'}
          </button>
        </div>
      </form>
    </main>
  );
}
