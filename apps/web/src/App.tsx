import { useEffect, useState } from 'react';
import { getHealth } from './api/health';

export default function App() {
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<'loading' | 'connected' | 'unavailable'>(
    'loading',
  );
  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);
    let active = true;
    getHealth(controller.signal)
      .then(() => {
        if (active) setStatus('connected');
      })
      .catch(() => {
        if (active) setStatus('unavailable');
      })
      .finally(() => window.clearTimeout(timeout));
    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [attempt]);
  return (
    <main>
      <p className="eyebrow">Your wedding, together</p>
      <h1>Vivah</h1>
      <p>A shared space for planning and celebrating your wedding.</p>
      <section aria-label="API connection">
        <p role="status" aria-live="polite">
          {status === 'loading'
            ? 'Connecting to the API…'
            : status === 'connected'
              ? 'API connected'
              : 'API unavailable. Start the backend and try again.'}
        </p>
        <button
          disabled={status === 'loading'}
          onClick={() => {
            setStatus('loading');
            setAttempt((value) => value + 1);
          }}
        >
          Retry connection
        </button>
      </section>
    </main>
  );
}
