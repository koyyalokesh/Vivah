import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getEvents, type WeddingEvent } from '../api/events';
import { getMembers, type WeddingMember } from '../api/members';
import {
  getTasks,
  updateTask,
  type TaskFilters,
  type TaskPriority,
  type TaskStatus,
  type WeddingTask,
} from '../api/tasks';
import { useAuth } from '../auth/useAuth';
import { formatTaskDate, isOverdue } from './task-time';
const statusLabels: Record<TaskStatus, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
};
const priorityLabels: Record<TaskPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};
export function TasksPage() {
  const { wedding } = useAuth();
  const zone = wedding?.timeZone ?? 'UTC';
  const [tasks, setTasks] = useState<WeddingTask[]>([]);
  const [members, setMembers] = useState<WeddingMember[]>([]);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [filters, setFilters] = useState<TaskFilters>({});
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
  });
  const [updatingTaskId, setUpdatingTaskId] = useState('');
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [message, setMessage] = useState('');
  useEffect(() => {
    let cancelled = false;
    getTasks(filters, page)
      .then((result) => {
        if (cancelled) return;
        if (
          result.pagination.totalPages > 0 &&
          page > result.pagination.totalPages
        ) {
          setPage(result.pagination.totalPages);
          return;
        }
        setTasks(result.data);
        setPagination({
          total: result.pagination.total,
          totalPages: result.pagination.totalPages,
        });
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [filters, page, refreshVersion]);
  useEffect(() => {
    Promise.all([getMembers(), getEvents()])
      .then(([m, e]) => {
        setMembers(m);
        setEvents(e);
      })
      .catch(() => undefined);
  }, []);
  async function toggle(task: WeddingTask) {
    if (updatingTaskId) return;
    const next: TaskStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    setUpdatingTaskId(task.id);
    try {
      await updateTask(task.id, {
        status: next,
        expectedUpdatedAt: task.updatedAt,
      });
      setMessage(next === 'COMPLETED' ? 'Task completed.' : 'Task reopened.');
      setStatus('loading');
      setRefreshVersion((current) => current + 1);
    } catch {
      setMessage('Unable to update the task.');
    } finally {
      setUpdatingTaskId('');
    }
  }
  const setFilter = (
    key: keyof TaskFilters,
    value: string | boolean | undefined,
  ) => {
    setStatus('loading');
    setPage(1);
    setFilters((current) => {
      const next = { ...current };
      if (value === undefined || value === '') delete next[key];
      else Object.assign(next, { [key]: value });
      return next;
    });
  };
  return (
    <main className="tasks-page">
      <header className="tasks-heading">
        <div>
          <span className="section-eyebrow">Wedding planning</span>
          <h1>Tasks</h1>
          <p>Keep every responsibility clear and on schedule.</p>
        </div>
        <Link className="button button-primary" to="/app/tasks/new">
          Add task
        </Link>
      </header>
      {message ? (
        <div className="task-toast" role="status">
          {message}
          <button onClick={() => setMessage('')} aria-label="Dismiss">
            ×
          </button>
        </div>
      ) : null}
      <section className="task-filters" aria-label="Task filters">
        <select
          aria-label="Status"
          value={filters.status ?? ''}
          onChange={(e) => setFilter('status', e.target.value)}
        >
          <option value="">All statuses</option>
          {Object.entries(statusLabels).map(([v, l]) => (
            <option value={v} key={v}>
              {l}
            </option>
          ))}
        </select>
        <select
          aria-label="Priority"
          value={filters.priority ?? ''}
          onChange={(e) => setFilter('priority', e.target.value)}
        >
          <option value="">All priorities</option>
          {Object.entries(priorityLabels).map(([v, l]) => (
            <option value={v} key={v}>
              {l}
            </option>
          ))}
        </select>
        <select
          aria-label="Event"
          value={filters.eventId ?? ''}
          onChange={(e) => setFilter('eventId', e.target.value)}
        >
          <option value="">All events</option>
          <option value="none">General tasks</option>
          {events.map((event) => (
            <option value={event.id} key={event.id}>
              {event.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Assignee"
          value={filters.assignedMembershipId ?? ''}
          onChange={(e) => setFilter('assignedMembershipId', e.target.value)}
        >
          <option value="">All members</option>
          <option value="none">Unassigned</option>
          {members.map((member) => (
            <option value={member.membershipId} key={member.membershipId}>
              {member.user.name}
            </option>
          ))}
        </select>
        <label className="task-mine">
          <input
            type="checkbox"
            checked={filters.mine ?? false}
            onChange={(e) => setFilter('mine', e.target.checked || undefined)}
          />{' '}
          My tasks
        </label>
        {Object.keys(filters).length ? (
          <button
            className="task-clear"
            onClick={() => {
              setStatus('loading');
              setPage(1);
              setFilters({});
            }}
          >
            Clear filters
          </button>
        ) : null}
      </section>
      {status === 'loading' ? (
        <section className="task-list">
          {[1, 2, 3].map((item) => (
            <div className="task-row task-skeleton" key={item} />
          ))}
        </section>
      ) : null}
      {status === 'error' ? (
        <section className="tasks-empty">
          <h2>We couldn’t load your tasks</h2>
          <p>Check your connection and try again.</p>
          <button
            className="button button-secondary"
            onClick={() => {
              setStatus('loading');
              setRefreshVersion((current) => current + 1);
            }}
          >
            Try again
          </button>
        </section>
      ) : null}
      {status === 'ready' && !tasks.length ? (
        <section className="tasks-empty">
          <span>✓</span>
          <h2>
            {Object.keys(filters).length
              ? 'No tasks match these filters'
              : 'Plan your first task'}
          </h2>
          <p>
            {Object.keys(filters).length
              ? 'Clear or change the filters to see more tasks.'
              : 'Create responsibilities, assign family members and keep wedding planning moving.'}
          </p>
          {Object.keys(filters).length ? (
            <button
              className="button button-secondary"
              onClick={() => {
                setStatus('loading');
                setPage(1);
                setFilters({});
              }}
            >
              Clear filters
            </button>
          ) : (
            <Link className="button button-primary" to="/app/tasks/new">
              Add your first task
            </Link>
          )}
        </section>
      ) : null}
      {status === 'ready' && tasks.length ? (
        <section className="task-list">
          {tasks.map((task) => {
            const overdue = isOverdue(task.dueDate, task.status, zone);
            return (
              <article
                className={`task-row${task.status === 'COMPLETED' ? ' is-complete' : ''}`}
                key={task.id}
              >
                <button
                  className="task-check"
                  disabled={Boolean(updatingTaskId)}
                  onClick={() => toggle(task)}
                  aria-label={
                    task.status === 'COMPLETED'
                      ? `Reopen ${task.title}`
                      : `Mark ${task.title} complete`
                  }
                >
                  {task.status === 'COMPLETED' ? '✓' : ''}
                </button>
                <Link className="task-row-main" to={`/app/tasks/${task.id}`}>
                  <div className="task-row-title">
                    <h2>{task.title}</h2>
                    <span
                      className={`task-priority is-${task.priority.toLowerCase()}`}
                    >
                      {priorityLabels[task.priority]}
                    </span>
                    {overdue ? (
                      <span className="task-overdue">Overdue</span>
                    ) : null}
                  </div>
                  <div className="task-meta">
                    <span>{statusLabels[task.status]}</span>
                    <span>
                      {task.assignee?.name ??
                        (task.assignedMembershipId
                          ? 'Former member'
                          : 'Unassigned')}
                    </span>
                    <span>{task.event?.name ?? 'General'}</span>
                    {task.dueDate ? (
                      <span>Due {formatTaskDate(task.dueDate, zone)}</span>
                    ) : null}
                  </div>
                </Link>
                <span className="task-arrow">›</span>
              </article>
            );
          })}
        </section>
      ) : null}
      {status === 'ready' && pagination.totalPages > 1 ? (
        <nav className="task-pagination" aria-label="Task pages">
          <button
            className="button button-secondary"
            disabled={page === 1}
            onClick={() => {
              setStatus('loading');
              setPage((current) => current - 1);
            }}
          >
            Previous
          </button>
          <span>
            Page {page} of {pagination.totalPages} · {pagination.total} tasks
          </span>
          <button
            className="button button-secondary"
            disabled={page === pagination.totalPages}
            onClick={() => {
              setStatus('loading');
              setPage((current) => current + 1);
            }}
          >
            Next
          </button>
        </nav>
      ) : null}
    </main>
  );
}
