type FeatureCardProps = {
  number: string;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
};

export function FeatureCard({
  number,
  eyebrow,
  title,
  description,
  bullets,
}: FeatureCardProps) {
  return (
    <article className="feature-card">
      <div className="feature-number">{number}</div>
      <span className="mini-label">{eyebrow}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      <ul>
        {bullets.map((bullet) => (
          <li key={bullet}>
            <span aria-hidden="true">✓</span>
            {bullet}
          </li>
        ))}
      </ul>
    </article>
  );
}
