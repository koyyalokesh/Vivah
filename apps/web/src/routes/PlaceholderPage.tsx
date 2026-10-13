import { Link } from 'react-router-dom';

type PlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PlaceholderPage({
  eyebrow,
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <main className="placeholder-page">
      <Link className="wordmark" to="/" aria-label="Vivah homepage">
        <span className="wordmark-mark" aria-hidden="true">
          V
        </span>
        <span>Vivah</span>
      </Link>
      <section className="placeholder-card">
        <span className="section-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        <Link className="button button-primary" to="/">
          Back to homepage
        </Link>
      </section>
    </main>
  );
}
