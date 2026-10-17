import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import {
  Navigate,
  useBlocker,
  useNavigate,
  type BlockerFunction,
} from 'react-router-dom';
import { ApiError, type Wedding, type WeddingMembership } from '../api/auth';
import { updateWedding, type UpdateWeddingInput } from '../api/wedding';
import { useAuth } from '../auth/useAuth';
import { ThemeSelector } from '../components/ui/ThemeSelector';
import {
  recoverWeddingEditDraft,
  type WeddingEditDraft,
  type WeddingEditField,
  type WeddingEditValues,
} from './wedding-edit-draft';

type EditValues = WeddingEditValues;
type Field = WeddingEditField;

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

function clean(values: EditValues): EditValues {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, value.trim()]),
  ) as EditValues;
}

function sameValues(first: EditValues, second: EditValues) {
  return (Object.keys(first) as Field[]).every(
    (field) => first[field] === second[field],
  );
}

function suggestedTitle(brideName: string, groomName: string) {
  const bride = brideName.trim();
  const groom = groomName.trim();
  return bride && groom ? `${bride} & ${groom}\u2019s Wedding` : '';
}

function isCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.valueOf()) &&
    date.getUTCFullYear() === Number(match[1]) &&
    date.getUTCMonth() + 1 === Number(match[2]) &&
    date.getUTCDate() === Number(match[3])
  );
}

function isTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

function readDraft(
  key: string,
  fallback: EditValues,
  userId: string,
  weddingId: string,
): { values: EditValues; recovered: boolean; conflicts: Field[] } {
  const emptyRecovery = { values: fallback, recovered: false, conflicts: [] };
  try {
    const stored = sessionStorage.getItem(key);
    if (!stored) return emptyRecovery;
    const recovery = recoverWeddingEditDraft(
      JSON.parse(stored) as unknown,
      fallback,
      userId,
      weddingId,
    );
    if (!recovery) {
      removeDraft(key);
      return emptyRecovery;
    }
    return recovery;
  } catch {
    return emptyRecovery;
  }
}

function storeDraft(key: string, draft: WeddingEditDraft) {
  try {
    sessionStorage.setItem(key, JSON.stringify(draft));
  } catch {
    // Storage can be unavailable in restricted browser modes. The form remains usable.
  }
}

function removeDraft(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Storage can be unavailable in restricted browser modes. The form remains usable.
  }
}

export function WeddingEditPage() {
  const { wedding, membership } = useAuth();
  if (!wedding || !membership) return <Navigate to="/app" replace />;
  return <WeddingEditForm wedding={wedding} membership={membership} />;
}

function WeddingEditForm({
  wedding,
  membership,
}: {
  wedding: Wedding;
  membership: WeddingMembership;
}) {
  const navigate = useNavigate();
  const { user, setWedding, expireSession, signOut } = useAuth();

  const serverValues: EditValues = {
    brideName: wedding.brideName,
    groomName: wedding.groomName,
    title: wedding.title ?? '',
    weddingDate: wedding.weddingDate,
    timeZone: wedding.timeZone,
    location: wedding.location?.formattedAddress ?? '',
    description: wedding.description ?? '',
  };
  const draftKey = `vivah:wedding-edit-draft:${wedding.id}:${membership.userId}`;
  const draftRecovery = useMemo(
    () => readDraft(draftKey, serverValues, membership.userId, wedding.id),
    // The wedding cannot change while this route remains mounted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draftKey],
  );
  const [baseline, setBaseline] = useState(clean(serverValues));
  const [values, setValues] = useState(draftRecovery.values);
  const [titleFollowsNames, setTitleFollowsNames] = useState(() =>
    Boolean(
      !draftRecovery.values.title.trim() ||
      draftRecovery.values.title.trim() ===
        suggestedTitle(
          draftRecovery.values.brideName,
          draftRecovery.values.groomName,
        ),
    ),
  );
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<Field, string>>
  >({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null);
  const [showRecoveredDraft, setShowRecoveredDraft] = useState(
    draftRecovery.recovered,
  );
  const [draftConflicts, setDraftConflicts] = useState(draftRecovery.conflicts);

  const normalizedValues = clean(values);
  const isDirty = !sameValues(normalizedValues, baseline);
  const allowNavigation = useRef(false);
  const blocker = useBlocker(
    useCallback<BlockerFunction>(
      ({ currentLocation, nextLocation }) =>
        !allowNavigation.current &&
        isDirty &&
        (currentLocation.pathname !== nextLocation.pathname ||
          currentLocation.search !== nextLocation.search ||
          currentLocation.hash !== nextLocation.hash),
      [isDirty],
    ),
  );

  useEffect(() => {
    if (isDirty) {
      storeDraft(draftKey, {
        version: 1,
        userId: membership.userId,
        weddingId: wedding.id,
        baseline,
        values,
      });
    } else {
      removeDraft(draftKey);
    }
  }, [baseline, draftKey, isDirty, membership.userId, values, wedding.id]);

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [isDirty]);

  function updateField(field: Field, value: string) {
    const isNameField = field === 'brideName' || field === 'groomName';
    setValues((current) => {
      const next = { ...current, [field]: value };

      if (isNameField && titleFollowsNames) {
        next.title = suggestedTitle(next.brideName, next.groomName);
      }
      return next;
    });
    if (field === 'title') {
      setTitleFollowsNames(
        !value.trim() ||
          value.trim() === suggestedTitle(values.brideName, values.groomName),
      );
    }
    setFieldErrors((current) => ({
      ...current,
      [field]: undefined,
      ...(isNameField ? { title: undefined } : {}),
    }));
    setError('');
    setSuccess('');
    setDraftConflicts((current) =>
      current.filter((conflictedField) => conflictedField !== field),
    );
  }

  function validate() {
    const errors: Partial<Record<Field, string>> = {};
    if (!normalizedValues.brideName)
      errors.brideName = 'Enter the bride\u2019s name.';
    else if (normalizedValues.brideName.length > 100)
      errors.brideName = 'Use 100 characters or fewer.';
    if (!normalizedValues.groomName)
      errors.groomName = 'Enter the groom\u2019s name.';
    else if (normalizedValues.groomName.length > 100)
      errors.groomName = 'Use 100 characters or fewer.';
    if (normalizedValues.title.length > 150)
      errors.title = 'Use 150 characters or fewer.';
    if (!isCalendarDate(normalizedValues.weddingDate))
      errors.weddingDate = 'Enter a valid wedding date.';
    if (!isTimeZone(normalizedValues.timeZone))
      errors.timeZone = 'Select a valid time zone.';
    if (normalizedValues.location.length > 250)
      errors.location = 'Use 250 characters or fewer.';
    if (normalizedValues.description.length > 500)
      errors.description = 'Use 500 characters or fewer.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function buildUpdate(): UpdateWeddingInput {
    const update: UpdateWeddingInput = {};
    for (const field of [
      'brideName',
      'groomName',
      'weddingDate',
      'timeZone',
    ] as const) {
      if (normalizedValues[field] !== baseline[field]) {
        update[field] = normalizedValues[field];
      }
    }
    if (normalizedValues.title !== baseline.title) {
      update.title = normalizedValues.title || null;
    }
    if (normalizedValues.description !== baseline.description) {
      update.description = normalizedValues.description || null;
    }
    if (normalizedValues.location !== baseline.location) {
      update.location = normalizedValues.location
        ? { formattedAddress: normalizedValues.location }
        : null;
    }
    return update;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!validate() || !isDirty) return;
    setIsSaving(true);

    try {
      const updatedWedding = await updateWedding(buildUpdate());
      setWedding(updatedWedding);
      const savedValues = clean({
        brideName: updatedWedding.brideName,
        groomName: updatedWedding.groomName,
        title: updatedWedding.title ?? '',
        weddingDate: updatedWedding.weddingDate,
        timeZone: updatedWedding.timeZone,
        location: updatedWedding.location?.formattedAddress ?? '',
        description: updatedWedding.description ?? '',
      });
      setBaseline(savedValues);
      setValues(savedValues);
      removeDraft(draftKey);
      setShowRecoveredDraft(false);
      setDraftConflicts([]);
      setSuccess('Wedding details saved.');
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        expireSession();
        allowNavigation.current = true;
        navigate('/login', {
          replace: true,
          state: { from: '/app/wedding/edit', sessionExpired: true },
        });
        return;
      }
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
        setError(
          'We could not save your changes. Your draft is preserved in this browser session.',
        );
      }
    } finally {
      setIsSaving(false);
    }
  }

  function requestLeave(action: () => void) {
    if (isDirty) setPendingLeave(() => action);
    else action();
  }

  function discardAndLeave() {
    removeDraft(draftKey);
    allowNavigation.current = true;
    setValues(baseline);
    if (blocker.state === 'blocked') {
      blocker.proceed();
      return;
    }
    const action = pendingLeave;
    setPendingLeave(null);
    action?.();
  }

  function keepEditing() {
    setPendingLeave(null);
    allowNavigation.current = false;
    if (blocker.state === 'blocked') blocker.reset();
  }

  async function logOut() {
    setIsSigningOut(true);
    try {
      await signOut();
      navigate('/', { replace: true });
    } catch {
      setError('Unable to log out. Please try again.');
      setIsSigningOut(false);
    }
  }

  return (
    <main className="wedding-edit-page">
      <header className="edit-header">
        <button
          className="edit-back"
          type="button"
          onClick={() => requestLeave(() => navigate('/app'))}
          aria-label="Return to wedding overview"
        >
          <span aria-hidden="true">{'\u2190'}</span>
          <span className="wordmark">Vivah</span>
          <small>Wedding overview</small>
        </button>
        <div className="edit-account">
          <ThemeSelector compact />
          <div className="edit-account-copy">
            <strong>{user?.name}</strong>
            <span>{user?.email}</span>
          </div>
          <span
            className={`role-badge role-badge-${membership.role.toLowerCase()}`}
          >
            {membership.role}
          </span>
          <span className="account-avatar" aria-hidden="true">
            {initials(user?.name ?? 'Vivah user')}
          </span>
          <button
            type="button"
            className="setup-logout"
            disabled={isSigningOut}
            onClick={() => requestLeave(() => void logOut())}
          >
            {isSigningOut ? 'Logging out\u2026' : 'Log out'}
          </button>
        </div>
      </header>

      <div className="edit-shell">
        <section className="edit-intro" aria-labelledby="edit-title">
          <span className="section-eyebrow">Wedding settings</span>
          <h1 id="edit-title">Edit wedding details</h1>
          <p>
            Keep your wedding information accurate as your plans take shape.
          </p>
          <div
            className={`save-state ${isDirty ? 'save-state-dirty' : ''}`}
            aria-live="polite"
          >
            <span aria-hidden="true">{isDirty ? '\u25cf' : '\u2713'}</span>
            {isDirty ? 'Unsaved changes' : 'All changes saved'}
          </div>
        </section>

        {showRecoveredDraft && isDirty ? (
          <div className="draft-notice" role="status">
            Your unsaved draft was restored from this browser session.
          </div>
        ) : null}

        {draftConflicts.length > 0 ? (
          <div className="form-alert" role="alert">
            Some draft fields were not restored because the wedding was updated
            after your draft was created. The latest saved values are shown for
            those fields.
          </div>
        ) : null}

        <div className="edit-card">
          <form
            className="wedding-form edit-form"
            onSubmit={handleSubmit}
            noValidate
          >
            {error ? (
              <div className="form-alert" role="alert">
                <strong>Changes were not saved.</strong> {error}
              </div>
            ) : null}
            {success ? (
              <div className="form-success" role="status">
                {success}
              </div>
            ) : null}

            <div className="form-row">
              <EditField
                id="brideName"
                label={'Bride\u2019s name'}
                value={values.brideName}
                onChange={updateField}
                error={fieldErrors.brideName}
                required
              />
              <EditField
                id="groomName"
                label={'Groom\u2019s name'}
                value={values.groomName}
                onChange={updateField}
                error={fieldErrors.groomName}
                required
              />
            </div>
            <div className="form-row">
              <EditField
                id="title"
                label="Wedding title"
                value={values.title}
                onChange={updateField}
                error={fieldErrors.title}
                helper="The name shown throughout your workspace."
                optional
              />
              <EditField
                id="weddingDate"
                label="Wedding date"
                type="date"
                value={values.weddingDate}
                onChange={updateField}
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
                  list="edit-time-zone-options"
                  value={values.timeZone}
                  onChange={(event) =>
                    updateField('timeZone', event.target.value)
                  }
                  aria-invalid={Boolean(fieldErrors.timeZone)}
                  aria-describedby={
                    fieldErrors.timeZone ? 'timeZone-error' : 'timeZone-help'
                  }
                  required
                />
                <datalist id="edit-time-zone-options">
                  {timeZones.map((zone) => (
                    <option key={zone} value={zone} />
                  ))}
                </datalist>
                <span className="field-help" id="timeZone-help">
                  Used to display event times correctly.
                </span>
                {fieldErrors.timeZone ? (
                  <span className="field-error" id="timeZone-error">
                    {fieldErrors.timeZone}
                  </span>
                ) : null}
              </div>
              <EditField
                id="location"
                label="Location"
                value={values.location}
                onChange={updateField}
                error={fieldErrors.location}
                helper="City, region, or primary venue."
                optional
              />
            </div>
            <div className="setup-field">
              <label htmlFor="description">
                Description <small>Optional</small>
              </label>
              <textarea
                id="description"
                value={values.description}
                onChange={(event) =>
                  updateField('description', event.target.value)
                }
                maxLength={500}
                aria-invalid={Boolean(fieldErrors.description)}
                aria-describedby={
                  fieldErrors.description
                    ? 'description-error'
                    : 'description-help'
                }
              />
              <span className="field-help" id="description-help">
                A brief note that describes your celebration.
              </span>
              {fieldErrors.description ? (
                <span className="field-error" id="description-error">
                  {fieldErrors.description}
                </span>
              ) : null}
            </div>

            <div className="edit-actions">
              <button
                className="button button-primary"
                type="submit"
                disabled={isSaving || !isDirty}
                aria-busy={isSaving}
              >
                {isSaving ? 'Saving changes\u2026' : 'Save changes'}
              </button>
              <button
                className="button button-secondary"
                type="button"
                disabled={isSaving}
                onClick={() => requestLeave(() => navigate('/app'))}
              >
                Cancel
              </button>
              <p>
                <span aria-hidden="true">{'\u25c7'}</span> Only members of your
                wedding workspace can view these details.
              </p>
            </div>
          </form>

          <aside className="edit-aside" aria-labelledby="details-title">
            <h2 id="details-title">About these details</h2>
            <p>
              Core wedding identity parameters used across all guest invitations
              and vendor communications.
            </p>
            <ol>
              <li>
                <span>1</span>
                <div>
                  <strong>Shared across your workspace</strong>
                  <p>Updates appear wherever your wedding details are shown.</p>
                </div>
              </li>
              <li>
                <span>2</span>
                <div>
                  <strong>Your wedding link stays stable</strong>
                  <p>
                    Changing names or the date does not alter the existing slug.
                  </p>
                </div>
              </li>
              <li>
                <span>3</span>
                <div>
                  <strong>Private by default</strong>
                  <p>
                    Only authenticated wedding members can manage these details.
                  </p>
                </div>
              </li>
            </ol>
          </aside>
        </div>
      </div>

      {pendingLeave || blocker.state === 'blocked' ? (
        <div className="modal-backdrop" role="presentation">
          <section
            className="leave-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-title"
          >
            <span className="dialog-icon" aria-hidden="true">
              !
            </span>
            <h2 id="leave-title">Discard unsaved changes?</h2>
            <p>
              Your edits have not been saved. Leaving now will remove this
              draft.
            </p>
            <div>
              <button
                className="button button-secondary"
                type="button"
                onClick={keepEditing}
              >
                Keep editing
              </button>
              <button
                className="button button-danger"
                type="button"
                onClick={discardAndLeave}
              >
                Discard changes
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function EditField({
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
  onChange(field: Field, value: string): void;
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
        onChange={(event) => onChange(id, event.target.value)}
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
