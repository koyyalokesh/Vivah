import { Link } from 'react-router-dom';

export function Header() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="wordmark" to="/" aria-label="Vivah homepage">
          <span className="wordmark-mark" aria-hidden="true">
            V
          </span>
          <span>Vivah</span>
        </Link>

        <nav className="primary-nav" aria-label="Primary navigation">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#privacy">Privacy</a>
          <a href="#faq">FAQs</a>
        </nav>

        <div className="header-actions">
          <Link className="text-link header-login" to="/login">
            Log in
          </Link>
          <Link className="button button-primary button-small" to="/signup">
            Start planning
          </Link>
        </div>
      </div>
    </header>
  );
}
