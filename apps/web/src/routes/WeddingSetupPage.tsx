import { useMemo, useState, type FormEvent } from 'react';
import { ApiError } from '../api/auth';
import { createWedding } from '../api/wedding';
import { useAuth } from '../auth/useAuth';

type Field =
  | 'brideName'
  | 'groomName'
  | 'title'
  | 'weddingDate'
  | 'timeZone'
  | 'location'
  | 'description';

const timeZones = Array.from(
  new Set([
    'Asia/Kolkata',
    ...(typeof Intl.supportedValuesOf === 'function'
      ? Intl.supportedValuesOf('timeZone')
      : [
          'Asia/Dubai',
          'Asia/Kathmandu',
          'Europe/London',
          'America/New_York',
          'America/Los_Angeles',
          'Australia/Sydney',
        ]),
  ]),
).sort();

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function WeddingSetupPage() {
  const { user, signOut, setWeddingContext } = useAuth();
  const [brideName, setBrideName] = useState('');
  const [groomName, setGroomName] = useState('');
  const [title, setTitle] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [timeZone, setTimeZone] = useState('Asia/Kolkata');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<Field, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const suggestedTitle = useMemo(
    () =>
      brideName.trim() && groomName.trim()
        ? `${brideName.trim()} & ${groomName.trim()}’s Wedding`
        : '',
    [brideName, groomName],
  );

  function updateName(setter: (value: string) => void, value: string) {
    const wasSuggested = !title || title === suggestedTitle;
    setter(value);
    if (wasSuggested) {
      const first = setter === setBrideName ? value.trim() : brideName.trim();
      const second = setter === setGroomName ? value.trim() : groomName.trim();
      setTitle(first && second ? `${first} & ${second}’s Wedding` : '');
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const context = await createWedding({
        brideName,
        groomName,
        ...(title.trim() ? { title: title.trim() } : {}),
        weddingDate,
        timeZone,
        ...(location.trim()
          ? { location: { formattedAddress: location.trim() } }
          : {}),
        ...(description.trim() ? { description: description.trim() } : {}),
      });
      setWeddingContext(context);
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
        setFieldErrors({
          brideName: caught.details?.brideName?.[0],
          groomName: caught.details?.groomName?.[0],
          title: caught.details?.title?.[0],
          weddingDate: caught.details?.weddingDate?.[0],
          timeZone: caught.details?.timeZone?.[0],
          location: caught.details?.location?.[0],
          description: caught.details?.description?.[0],
        });
      } else {
        setError('Unable to create your wedding. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

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
    <main className="wedding-setup-page">
      <header className="setup-header">
        <div className="wordmark">
          <span className="wordmark-mark" aria-hidden="true">
            V
          </span>
          <span>Vivah</span>
        </div>
        <div className="setup-account">
          <span className="account-avatar" aria-hidden="true">
            {initials(user?.name ?? 'Vivah user')}
          </span>
          <span className="account-name">{user?.name}</span>
          <button
            className="setup-logout"
            type="button"
            onClick={handleLogout}
            disabled={isSigningOut}
          >
            {isSigningOut ? 'Logging out…' : 'Log out'}
          </button>
        </div>
      </header>

      <div className="setup-shell">
        <section className="setup-intro" aria-labelledby="setup-title">
          <div className="setup-meta">
            <span className="section-eyebrow">Wedding setup</span>
            <span>1 of 1 · Wedding details</span>
          </div>
          <h1 id="setup-title">Let’s create your wedding</h1>
          <p>
            Add the essentials now. You can refine the details as your plans
            take shape.
          </p>
        </section>

        <div className="setup-card">
          <form className="wedding-form" onSubmit={handleSubmit} noValidate>
            {error ? (
              <div className="form-alert" role="alert">
                {error}
              </div>
            ) : null}
            <div className="form-row">
              <SetupField
                id="brideName"
                label="Bride’s name"
                value={brideName}
                onChange={(value) => updateName(setBrideName, value)}
                error={fieldErrors.brideName}
                autoComplete="off"
                required
              />
              <SetupField
                id="groomName"
                label="Groom’s name"
                value={groomName}
                onChange={(value) => updateName(setGroomName, value)}
                error={fieldErrors.groomName}
                autoComplete="off"
                required
              />
            </div>
            <div className="form-row">
              <SetupField
                id="title"
                label="Wedding title"
                value={title}
                onChange={setTitle}
                error={fieldErrors.title}
                helper="The name shown throughout your workspace."
                optional
              />
              <SetupField
                id="weddingDate"
                label="Wedding date"
                type="date"
                value={weddingDate}
                onChange={setWeddingDate}
                error={fieldErrors.weddingDate}
                required
              />
            </div>
            <div className="form-row">
              <div className="setup-field">
                <label htmlFor="timeZone">
                  Time zone <span>*</span>
                </label>
                <input
                  id="timeZone"
                  type="text"
                  list="time-zone-options"
                  value={timeZone}
                  onChange={(event) => setTimeZone(event.target.value)}
                  aria-invalid={Boolean(fieldErrors.timeZone)}
                  aria-describedby={
                    fieldErrors.timeZone ? 'timeZone-error' : undefined
                  }
                  required
                />
                <datalist id="time-zone-options">
                  {timeZones.map((zone) => (
                    <option key={zone} value={zone} />
                  ))}
                </datalist>
                {fieldErrors.timeZone ? (
                  <span className="field-error" id="timeZone-error">
                    {fieldErrors.timeZone}
                  </span>
                ) : null}
              </div>
              <SetupField
                id="location"
                label="Location"
                value={location}
                onChange={setLocation}
                error={fieldErrors.location}
                placeholder="Jaipur, Rajasthan"
                helper="City, region, or primary venue"
                optional
              />
            </div>
            <div className="setup-field">
              <label htmlFor="description">
                Description <small>Optional</small>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="A joyful celebration with our closest family and friends."
                maxLength={500}
                aria-invalid={Boolean(fieldErrors.description)}
                aria-describedby={
                  fieldErrors.description
                    ? 'description-error'
                    : 'description-help'
                }
              />
              <span className="field-help" id="description-help">
                A brief note to guide your planning vision
              </span>
              {fieldErrors.description ? (
                <span className="field-error" id="description-error">
                  {fieldErrors.description}
                </span>
              ) : null}
            </div>
            <div className="setup-actions">
              <button className="button button-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Creating wedding…' : 'Create wedding'}
                {!isSubmitting ? <span aria-hidden="true">→</span> : null}
              </button>
              <p>
                <span aria-hidden="true">⌑</span> Your wedding workspace is
                private.
              </p>
            </div>
          </form>

          <aside className="setup-aside" aria-labelledby="next-title">
            <div>
              <span className="aside-label">Private workspace</span>
              <h2 id="next-title">What happens next?</h2>
              <ol>
                <li>
                  <span>1</span>
                  <div>
                    <strong>Your workspace is created</strong>
                    <p>A private place for your wedding plans.</p>
                  </div>
                </li>
                <li>
                  <span>2</span>
                  <div>
                    <strong>You become the Admin</strong>
                    <p>You can manage your wedding workspace.</p>
                  </div>
                </li>
                <li>
                  <span>3</span>
                  <div>
                    <strong>Start planning one feature at a time</strong>
                    <p>Continue to your new workspace.</p>
                  </div>
                </li>
              </ol>
            </div>
            <div className="setup-art" aria-hidden="true">
              <span className="arch arch-one" />
              <span className="arch arch-two" />
              <span className="art-ring" />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function SetupField({
  id,
  label,
  value,
  onChange,
  error,
  helper,
  optional,
  type = 'text',
  ...inputProps
}: {
  id: Field;
  label: string;
  value: string;
  onChange(value: string): void;
  error?: string;
  helper?: string;
  optional?: boolean;
  type?: string;
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'id' | 'value' | 'onChange' | 'type'
>) {
  const describedBy = error ? `${id}-error` : helper ? `${id}-help` : undefined;
  return (
    <div className="setup-field">
      <label htmlFor={id}>
        {label} {optional ? <small>Optional</small> : <span>*</span>}
      </label>
      <input
        {...inputProps}
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
      />
      {helper ? (
        <span className="field-help" id={`${id}-help`}>
          {helper}
        </span>
      ) : null}
      {error ? (
        <span className="field-error" id={`${id}-error`}>
          {error}
        </span>
      ) : null}
    </div>
  );
}
