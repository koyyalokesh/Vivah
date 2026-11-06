import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  deleteTask,
  getTask,
  updateTask,
  type WeddingTask,
} from '../api/tasks';
import { useAuth } from '../auth/useAuth';
import { formatTaskDate, isOverdue } from './task-time';
const status = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
};
const priority = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High' };
export function TaskDetailsPage() {
  const { taskId = '' } = useParams();
  const navigate = useNavigate();
  const { wedding } = useAuth();
  const zone = wedding?.timeZone ?? 'UTC';
  const [task, setTask] = useState<WeddingTask | null>(null);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const removeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const keepTaskButtonRef = useRef<HTMLButtonElement>(null);
  const removingRef = useRef(false);
  useEffect(() => {
    getTask(taskId)
      .then(setTask)
      .catch(() => setError('This task could not be found.'));
  }, [taskId]);
  useEffect(() => {
    removingRef.current = removing;
  }, [removing]);
  useEffect(() => {
    if (!confirming) return;

    const opener = removeButtonRef.current;
    keepTaskButtonRef.current?.focus();

    function handleDialogKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (removingRef.current) return;
        event.preventDefault();
        setConfirming(false);
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleDialogKeyDown);
    return () => {
      document.removeEventListener('keydown', handleDialogKeyDown);
      opener?.focus();
    };
  }, [confirming]);
  async function toggle() {
    if (!task) return;
    setUpdating(true);
    setError('');
    try {
      setTask(
        await updateTask(task.id, {
          status: task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED',
          expectedUpdatedAt: task.updatedAt,
        }),
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Unable to update this task.',
      );
    } finally {
      setUpdating(false);
    }
  }
  async function remove() {
    setRemoving(true);
    try {
      await deleteTask(taskId);
      navigate('/app/tasks', { replace: true });
    } catch {
      setError('Unable to remove this task.');
      setRemoving(false);
      setConfirming(false);
    }
  }
  if (error && !task)
    return (
      <main className="task-details-page">
        <Link className="task-back" to="/app/tasks">
          ← Back to tasks
        </Link>
        <section className="tasks-empty">
          <h1>Task unavailable</h1>
          <p>{error}</p>
        </section>
      </main>
    );
  if (!task)
    return (
      <main className="task-details-page">
        <p>Loading task…</p>
      </main>
    );
  const overdue = isOverdue(task.dueDate, task.status, zone);
  return (
    <main className="task-details-page">
      <Link className="task-back" to="/app/tasks">
        ← Back to tasks
      </Link>
      <header className="task-detail-heading">
        <div>
          <div className="task-detail-badges">
            <span className={`task-status is-${task.status.toLowerCase()}`}>
              {status[task.status]}
            </span>
            <span className={`task-priority is-${task.priority.toLowerCase()}`}>
              {priority[task.priority]} priority
            </span>
            {overdue ? <span className="task-overdue">Overdue</span> : null}
          </div>
          <h1>{task.title}</h1>
        </div>
        <div className="task-detail-actions">
          <button
            className="button button-secondary"
            disabled={updating}
            onClick={toggle}
          >
            {updating
              ? 'Updating…'
              : task.status === 'COMPLETED'
                ? 'Reopen task'
                : 'Mark complete'}
          </button>
          <Link
            className="button button-primary"
            to={`/app/tasks/${task.id}/edit`}
          >
            Edit task
          </Link>
        </div>
      </header>
      {error ? (
        <div className="form-error" role="alert">
          {error}
        </div>
      ) : null}
      <section className="task-detail-grid">
        <article>
          <span>Assigned to</span>
          <h2>
            {task.assignee?.name ??
              (task.assignedMembershipId ? 'Former member' : 'Unassigned')}
          </h2>
          {task.assignee ? (
            <small>
              {task.assignee.role === 'ADMIN' ? 'Admin' : 'Manager'}
            </small>
          ) : null}
        </article>
        <article>
          <span>Related event</span>
          <h2>{task.event?.name ?? 'General wedding task'}</h2>
          {task.event?.archivedAt ? <small>Archived event</small> : null}
        </article>
        <article>
          <span>Due date</span>
          <h2>
            {task.dueDate ? formatTaskDate(task.dueDate, zone) : 'No due date'}
          </h2>
          <small>
            {task.dueDate ? zone : 'Add a date when timing is confirmed.'}
          </small>
        </article>
      </section>
      <section className="task-description">
        <span>Description</span>
        <p>{task.description || 'No description added.'}</p>
      </section>
      {task.completedAt ? (
        <section className="task-completed-note">
          <strong>Completed {formatTaskDate(task.completedAt, zone)}</strong>
        </section>
      ) : null}
      <div className="task-danger-zone">
        <button ref={removeButtonRef} onClick={() => setConfirming(true)}>
          Remove task
        </button>
      </div>
      {confirming ? (
        <div className="dialog-backdrop">
          <section
            ref={dialogRef}
            className="event-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-task-title"
            aria-describedby="remove-task-description"
          >
            <span className="event-dialog-mark">×</span>
            <h2 id="remove-task-title">Remove this task?</h2>
            <p id="remove-task-description">
              “{task.title}” will be removed from your wedding plan. This action
              cannot be undone.
            </p>
            <div>
              <button
                ref={keepTaskButtonRef}
                className="button button-secondary"
                disabled={removing}
                onClick={() => setConfirming(false)}
              >
                Keep task
              </button>
              <button
                className="button button-danger"
                disabled={removing}
                onClick={remove}
              >
                {removing ? 'Removing…' : 'Remove task'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
