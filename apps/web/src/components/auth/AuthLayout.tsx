import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ThemeSelector } from '../ui/ThemeSelector';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page">
      <div className="auth-theme-control">
        <ThemeSelector />
      </div>
      <Link
        className="wordmark auth-wordmark"
        to="/"
        aria-label="Vivah homepage"
      >
        <span className="wordmark-mark" aria-hidden="true">
          V
        </span>
        <span>Vivah</span>
      </Link>
      <section className="auth-panel">{children}</section>
      <p className="auth-footnote">
        Private planning for the people you trust.
      </p>
    </main>
  );
}
