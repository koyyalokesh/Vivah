import { useEffect, useState, type FormEvent } from 'react';
import { Link, useBlocker, useNavigate, useParams } from 'react-router-dom';
import { getEvents, type WeddingEvent } from '../api/events';
import { getMembers, type WeddingMember } from '../api/members';
import {
  createTask,
  getTask,
  updateTask,
  type TaskPriority,
  type TaskStatus,
} from '../api/tasks';
import { useAuth } from '../auth/useAuth';
import { dateToWeddingIso, weddingDate } from './task-time';
type FormState = {
  title: string;
  description: string;
  assignedMembershipId: string;
  eventId: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
};
const empty: FormState = {
  title: '',
  description: '',
  assignedMembershipId: '',
  eventId: '',
  dueDate: '',
  priority: 'MEDIUM',
  status: 'TODO',
};
export function TaskFormPage() {
  const { taskId } = useParams();
  const editing = Boolean(taskId);
  const navigate = useNavigate();
  const { wedding } = useAuth();
  const zone = wedding?.timeZone ?? 'UTC';
  const [form, setForm] = useState(empty);
  const [baseline, setBaseline] = useState(empty);
  const [version, setVersion] = useState('');
  const [members, setMembers] = useState<WeddingMember[]>([]);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [loading, setLoading] = useState(editing);
  const [loadFailed, setLoadFailed] = useState(false);
  const [retryVersion, setRetryVersion] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    Promise.all([getMembers(), getEvents()])
      .then(([m, e]) => {
        setMembers(m);
        setEvents(e);
      })
      .catch(() => setError('Some assignment options could not be loaded.'));
  }, []);
  useEffect(() => {
    if (!taskId) return;
    getTask(taskId)
      .then((task) => {
        const loaded = {
          title: task.title,
          description: task.description ?? '',
          assignedMembershipId: task.assignedMembershipId ?? '',
          eventId: task.eventId ?? '',
          dueDate: weddingDate(task.dueDate, zone),
          priority: task.priority,
          status: task.status,
        };
        setForm(loaded);
        setBaseline(loaded);
        setVersion(task.updatedAt);
        setLoadFailed(false);
        setLoading(false);
      })
      .catch(() => {
        setError('Unable to load this task.');
        setLoadFailed(true);
        setLoading(false);
      });
  }, [taskId, zone, retryVersion]);
  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);
  const blocker = useBlocker(dirty && !saving);
  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    if (window.confirm('Discard your unsaved task changes?')) blocker.proceed();
    else blocker.reset();
  }, [blocker]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    if (dirty && !saving) window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, saving]);
  const change = (field: keyof FormState, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const input = {
        title: form.title,
        description: form.description || null,
        assignedMembershipId: form.assignedMembershipId || null,
        eventId: form.eventId || null,
        dueDate: dateToWeddingIso(form.dueDate, zone),
        priority: form.priority,
        status: form.status,
      };
      const saved =
        editing && taskId
          ? await updateTask(taskId, { ...input, expectedUpdatedAt: version })
          : await createTask(input);
      navigate(`/app/tasks/${saved.id}`, { replace: true });
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Unable to save this task.',
      );
      setSaving(false);
    }
  }
  if (loading)
    return (
      <main className="task-form-page">
        <p>Loading task…</p>
      </main>
    );
  if (editing && loadFailed)
    return (
      <main className="task-form-page">
        <Link className="task-back" to="/app/tasks">
          ← Back to tasks
        </Link>
        <section className="tasks-empty">
          <h1>Task unavailable</h1>
          <p>{error}</p>
          <button
            className="button button-secondary"
            onClick={() => {
              setError('');
              setLoadFailed(false);
              setLoading(true);
              setRetryVersion((current) => current + 1);
            }}
          >
            Try again
          </button>
        </section>
      </main>
    );
  return (
    <main className="task-form-page">
      <Link
        className="task-back"
        to={editing && taskId ? `/app/tasks/${taskId}` : '/app/tasks'}
      >
        ← Back to tasks
      </Link>
      <header>
        <span className="section-eyebrow">Wedding planning</span>
        <h1>{editing ? 'Edit task' : 'Add task'}</h1>
        <p>
          {editing
            ? 'Update responsibility, assignment or timing.'
            : 'Create a responsibility and keep your planning team aligned.'}
        </p>
      </header>
      <form className="task-form" onSubmit={submit}>
        {error ? (
          <div className="form-error" role="alert">
            {error}
          </div>
        ) : null}
        <section>
          <h2>Task details</h2>
          <label className="task-field">
            <span>
              Title <b>*</b>
            </span>
            <input
              required
              maxLength={200}
              value={form.title}
              onChange={(e) => change('title', e.target.value)}
              placeholder="e.g. Finalize photographer"
            />
          </label>
          <label className="task-field">
            <span>Description</span>
            <textarea
              rows={5}
              maxLength={2000}
              value={form.description}
              onChange={(e) => change('description', e.target.value)}
              placeholder="Add useful details for your planning team"
            />
          </label>
        </section>
        <section>
          <h2>Assignment</h2>
          <div className="task-form-grid">
            <label className="task-field">
              <span>Assigned member</span>
              <select
                value={form.assignedMembershipId}
                onChange={(e) => change('assignedMembershipId', e.target.value)}
              >
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option value={member.membershipId} key={member.membershipId}>
                    {member.user.name} ·{' '}
                    {member.role === 'ADMIN' ? 'Admin' : 'Manager'}
                  </option>
                ))}
                {form.assignedMembershipId &&
                !members.some(
                  (m) => m.membershipId === form.assignedMembershipId,
                ) ? (
                  <option value={form.assignedMembershipId}>
                    Former member
                  </option>
                ) : null}
              </select>
            </label>
            <label className="task-field">
              <span>Related event</span>
              <select
                value={form.eventId}
                onChange={(e) => change('eventId', e.target.value)}
              >
                <option value="">General wedding task</option>
                {events.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.name}
                  </option>
                ))}
                {form.eventId && !events.some((e) => e.id === form.eventId) ? (
                  <option value={form.eventId}>Archived event</option>
                ) : null}
              </select>
            </label>
          </div>
        </section>
        <section>
          <div className="task-section-heading">
            <h2>Schedule & priority</h2>
            <small>Due dates use {zone}</small>
          </div>
          <div className="task-form-grid">
            <label className="task-field">
              <span>Due date</span>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => change('dueDate', e.target.value)}
              />
            </label>
            <label className="task-field">
              <span>Priority</span>
              <select
                value={form.priority}
                onChange={(e) => change('priority', e.target.value)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </label>
            <label className="task-field">
              <span>Status</span>
              <select
                value={form.status}
                onChange={(e) => change('status', e.target.value)}
              >
                <option value="TODO">To do</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </label>
          </div>
        </section>
        <div className="task-form-actions">
          <Link
            className="button button-secondary"
            to={editing && taskId ? `/app/tasks/${taskId}` : '/app/tasks'}
          >
            Cancel
          </Link>
          <button className="button button-primary" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </form>
    </main>
  );
}
