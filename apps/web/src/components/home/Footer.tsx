import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <Link className="wordmark" to="/" aria-label="Vivah homepage">
            <span className="wordmark-mark" aria-hidden="true">
              V
            </span>
            <span>Vivah</span>
          </Link>
          <p>Your wedding journey, thoughtfully organized.</p>
        </div>
        <div>
          <span className="footer-label">Explore</span>
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#privacy">Privacy</a>
          <a href="#faq">FAQs</a>
        </div>
        <div>
          <span className="footer-label">Account</span>
          <Link to="/login">Log in</Link>
          <Link to="/signup">Start planning</Link>
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>© {new Date().getFullYear()} Vivah</span>
        <span>Made for celebrations shared with family.</span>
      </div>
    </footer>
  );
}
