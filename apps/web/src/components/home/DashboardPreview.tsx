const events = [
  {
    day: '12',
    month: 'FEB',
    name: 'Mehendi',
    detail: '4:00 PM · Garden Courtyard',
  },
  {
    day: '13',
    month: 'FEB',
    name: 'Sangeet',
    detail: '7:00 PM · Main Ballroom',
  },
  {
    day: '14',
    month: 'FEB',
    name: 'Wedding',
    detail: '6:30 PM · Lake Pavilion',
  },
];

export function DashboardPreview() {
  return (
    <div
      className="dashboard-frame"
      aria-label="Illustrative Vivah workspace preview"
    >
      <div className="dashboard-toolbar">
        <div className="window-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <span>Illustrative workspace</span>
        <span className="toolbar-status">42 days to go</span>
      </div>

      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <div>
            <div className="couple-avatar">A&amp;A</div>
            <strong>Aarav &amp; Ananya</strong>
            <span>Udaipur celebration</span>
          </div>
          <ul>
            <li className="active">Overview</li>
            <li>Events</li>
            <li>Tasks</li>
            <li>Guests</li>
            <li>Expenses</li>
            <li>Vendors</li>
          </ul>
          <div className="member-stack">
            <span>AS</span>
            <span>AM</span>
            <span>RK</span>
            <small>5 wedding members</small>
          </div>
        </aside>

        <div className="dashboard-content">
          <div className="dashboard-heading">
            <div>
              <span className="mini-label">WEDDING OVERVIEW</span>
              <h2>Good morning, Ananya</h2>
            </div>
            <span className="preview-action">Add task</span>
          </div>

          <div className="stat-grid">
            <article>
              <span>Events</span>
              <strong>6</strong>
              <small>across 3 days</small>
            </article>
            <article>
              <span>Tasks</span>
              <strong>32 / 48</strong>
              <small>completed</small>
            </article>
            <article>
              <span>Guests</span>
              <strong>186</strong>
              <small>132 responses</small>
            </article>
            <article>
              <span>Recorded expenses</span>
              <strong>₹12,45,000</strong>
              <small>across 8 vendors</small>
            </article>
          </div>

          <div className="dashboard-panels">
            <article className="timeline-card">
              <div className="panel-heading">
                <strong>Upcoming events</strong>
                <span>View all</span>
              </div>
              {events.map((event) => (
                <div className="event-row" key={event.name}>
                  <time>
                    <strong>{event.day}</strong>
                    <span>{event.month}</span>
                  </time>
                  <div>
                    <strong>{event.name}</strong>
                    <span>{event.detail}</span>
                  </div>
                </div>
              ))}
            </article>

            <article className="task-card">
              <div className="panel-heading">
                <strong>Next task</strong>
                <span className="priority-chip">HIGH</span>
              </div>
              <div className="task-check" aria-hidden="true" />
              <strong>Confirm the final guest list</strong>
              <p>Assigned to Riya · Due tomorrow</p>
              <div className="progress-label">
                <span>Overall progress</span>
                <strong>67%</strong>
              </div>
              <div className="progress-track">
                <span />
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}
