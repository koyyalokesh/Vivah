import { Link } from 'react-router-dom';
import { DashboardPreview } from '../components/home/DashboardPreview';
import { Faq } from '../components/home/Faq';
import { FeatureCard } from '../components/home/FeatureCard';
import { Footer } from '../components/home/Footer';
import { Header } from '../components/home/Header';

const problems = [
  {
    marker: '01',
    title: 'Conversations everywhere',
    text: 'Important decisions disappear inside calls, chats and long message threads.',
    outcome: 'Keep the plan in one shared workspace',
  },
  {
    marker: '02',
    title: 'Responsibilities feel unclear',
    text: 'Family members know what needs doing, but not always who owns the next step.',
    outcome: 'Give every task an owner and deadline',
  },
  {
    marker: '03',
    title: 'Lists stop matching',
    text: 'Guest counts, expenses and event details drift across separate spreadsheets.',
    outcome: 'Work from one dependable source of truth',
  },
];

const features = [
  {
    number: '01',
    eyebrow: 'Events',
    title: 'Bring every ceremony into view.',
    description:
      'Plan multi-day celebrations with the dates, times, venues and details everyone needs.',
    bullets: [
      'Suggested Indian wedding events',
      'Custom ceremonies',
      'Venue and dress-code details',
    ],
  },
  {
    number: '02',
    eyebrow: 'Tasks',
    title: 'Know what needs to happen next.',
    description:
      'Turn decisions into clear tasks, with a person responsible and a date to work toward.',
    bullets: [
      'Admin and Manager assignments',
      'Priorities and due dates',
      'To do, in progress and completed',
    ],
  },
  {
    number: '03',
    eyebrow: 'Guests & RSVPs',
    title: 'Make guest coordination simple.',
    description:
      'Manage invitation groups and collect responses through private links without asking guests to sign up.',
    bullets: [
      'Event-level invitations',
      'Party-size limits',
      'Email and WhatsApp sharing',
    ],
  },
  {
    number: '04',
    eyebrow: 'Expenses & vendors',
    title: 'Keep the practical details together.',
    description:
      'Record actual or committed expenses and maintain the vendors chosen for your wedding.',
    bullets: [
      'Expense categories and totals',
      'Optional event and vendor links',
      'Local vendor discovery',
    ],
  },
  {
    number: '05',
    eyebrow: 'Wedding website',
    title: 'Share your celebration beautifully.',
    description:
      'Publish general wedding information with a chosen theme and an optional YouTube livestream.',
    bullets: [
      'Couple story and event guide',
      'Three predefined themes',
      'Configured YouTube livestream',
    ],
  },
  {
    number: '06',
    eyebrow: 'Private memories',
    title: 'Collect every candid moment.',
    description:
      'Give family and guests a private gallery where they can view and contribute wedding photos.',
    bullets: [
      'Private gallery link',
      'QR code sharing',
      'Guest uploads without an account',
    ],
  },
];

export function HomePage() {
  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="hero-glow hero-glow-one" aria-hidden="true" />
          <div className="hero-glow hero-glow-two" aria-hidden="true" />
          <div className="shell hero-copy">
            <span className="hero-eyebrow">
              <span aria-hidden="true" /> Made for Indian weddings
            </span>
            <h1>
              Plan every celebration,<em> together.</em>
            </h1>
            <p>
              One calm workspace for events, tasks, guests, expenses, vendors,
              invitations and shared memories.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" to="/signup">
                Start planning <span aria-hidden="true">→</span>
              </Link>
              <a className="button button-secondary" href="#features">
                Explore features
              </a>
            </div>
            <div className="hero-trust">
              <span>One wedding workspace</span>
              <span>Guests need no account</span>
              <span>Built for families</span>
            </div>
          </div>
          <div className="shell dashboard-wrap">
            <DashboardPreview />
          </div>
        </section>

        <section className="problem-section section-pad">
          <div className="shell">
            <div className="section-heading split-heading">
              <div>
                <span className="section-eyebrow">A clearer way to plan</span>
                <h2>
                  Wedding planning shouldn’t live in six different places.
                </h2>
              </div>
              <p>
                Vivah replaces scattered chats, spreadsheets and notes with one
                dependable space your trusted people can share.
              </p>
            </div>
            <div className="problem-grid">
              {problems.map((problem) => (
                <article key={problem.marker}>
                  <span className="problem-marker">{problem.marker}</span>
                  <h3>{problem.title}</h3>
                  <p>{problem.text}</p>
                  <div>
                    <span aria-hidden="true">✓</span>
                    {problem.outcome}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="feature-section section-pad" id="features">
          <div className="shell">
            <div className="section-heading centered-heading">
              <span className="section-eyebrow section-eyebrow-light">
                The Vivah workspace
              </span>
              <h2>Every essential, connected.</h2>
              <p>
                Follow the wedding from the first planning conversation to the
                memories everyone takes home.
              </p>
            </div>
            <div className="feature-grid">
              {features.map((feature) => (
                <FeatureCard key={feature.number} {...feature} />
              ))}
            </div>
          </div>
        </section>

        <section className="guest-section section-pad">
          <div className="shell guest-layout">
            <div className="guest-copy">
              <span className="section-eyebrow">Designed for guests, too</span>
              <h2>A warm welcome, without another account.</h2>
              <p>
                Each guest receives a private link that shows only their invited
                events. They can RSVP and contribute photos without logging in.
              </p>
              <ul className="check-list">
                <li>
                  <span>✓</span>Personal invitation links
                </li>
                <li>
                  <span>✓</span>Event-specific itineraries
                </li>
                <li>
                  <span>✓</span>Simple party-size RSVP
                </li>
                <li>
                  <span>✓</span>Private gallery and QR access
                </li>
              </ul>
            </div>
            <div
              className="phone-stage"
              aria-label="Illustrative guest invitation and RSVP screens"
            >
              <div className="phone phone-back">
                <div className="phone-notch" />
                <span className="mini-label">YOU’RE INVITED</span>
                <h3>
                  Aarav
                  <br />
                  <em>&amp;</em> Ananya
                </h3>
                <p>
                  14 February 2027
                  <br />
                  Udaipur, Rajasthan
                </p>
                <div className="invitation-event">
                  <span>Wedding ceremony</span>
                  <strong>6:30 PM</strong>
                </div>
              </div>
              <div className="phone phone-front">
                <div className="phone-notch" />
                <span className="mini-label">YOUR RSVP</span>
                <h3>Will you join us?</h3>
                <div className="choice active">
                  <span>✓</span>Joyfully attending
                </div>
                <div className="choice">
                  <span />
                  Unable to attend
                </div>
                <label>
                  Number attending
                  <span className="select-mock">
                    2 people <b>⌄</b>
                  </span>
                </label>
                <div className="phone-button">Confirm RSVP</div>
              </div>
            </div>
          </div>
        </section>

        <section className="steps-section section-pad" id="how-it-works">
          <div className="shell">
            <div className="section-heading centered-heading">
              <span className="section-eyebrow">How it works</span>
              <h2>From first plan to final photograph.</h2>
              <p>
                Start small, invite your people and add each part when you need
                it.
              </p>
            </div>
            <div className="steps-grid">
              <article>
                <span>01</span>
                <h3>Create your wedding space</h3>
                <p>
                  Add the couple, primary date, location and the celebrations
                  you are planning.
                </p>
              </article>
              <article>
                <span>02</span>
                <h3>Plan with your people</h3>
                <p>
                  Invite Admins and Managers, then organize tasks, guests,
                  expenses and vendors together.
                </p>
              </article>
              <article>
                <span>03</span>
                <h3>Share the celebration</h3>
                <p>
                  Send invitation links, publish your wedding site and collect
                  memories in one private gallery.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="privacy-section section-pad" id="privacy">
          <div className="shell privacy-card">
            <div className="privacy-intro">
              <span className="section-eyebrow section-eyebrow-light">
                Thoughtful privacy
              </span>
              <h2>Your plans stay with the people you trust.</h2>
              <p>
                The planning workspace belongs to one wedding. Guest experiences
                use separate, private links and expose only the information
                needed.
              </p>
            </div>
            <div className="privacy-points">
              <article>
                <span>01</span>
                <div>
                  <h3>One wedding boundary</h3>
                  <p>
                    Private planning data stays inside its wedding workspace.
                  </p>
                </div>
              </article>
              <article>
                <span>02</span>
                <div>
                  <h3>Clear member roles</h3>
                  <p>
                    Admins manage membership; Admins and Managers plan together.
                  </p>
                </div>
              </article>
              <article>
                <span>03</span>
                <div>
                  <h3>Purpose-built guest links</h3>
                  <p>
                    Guests see their invitation or gallery without entering the
                    planning workspace.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="faq-section section-pad" id="faq">
          <div className="shell faq-layout">
            <div className="section-heading">
              <span className="section-eyebrow">Questions, answered</span>
              <h2>Everything you need to know before you begin.</h2>
              <p>
                Vivah keeps V1 focused on the practical work of planning and
                sharing one wedding.
              </p>
            </div>
            <Faq />
          </div>
        </section>

        <section className="final-cta">
          <div className="shell final-cta-inner">
            <span className="section-eyebrow section-eyebrow-light">
              Your wedding, together
            </span>
            <h2>Give every detail a place to belong.</h2>
            <p>
              Bring your celebrations, people and plans into one calm workspace.
            </p>
            <Link className="button button-inverse" to="/signup">
              Start planning with Vivah <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
