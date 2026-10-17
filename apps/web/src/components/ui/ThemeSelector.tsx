import type { ThemePreference } from '../../theme/theme';
import { useTheme } from '../../theme/useTheme';

const options: Array<{ value: ThemePreference; label: string }> = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

function ThemeIcon({ theme }: { theme: ThemePreference }) {
  if (theme === 'light') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="3.5" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" />
      </svg>
    );
  }

  if (theme === 'dark') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

export function ThemeSelector({ compact = false }: { compact?: boolean }) {
  const { preference, setPreference } = useTheme();

  return (
    <div
      className={`theme-selector${compact ? ' theme-selector-compact' : ''}`}
      role="group"
      aria-label="Appearance"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={preference === option.value ? 'is-selected' : undefined}
          aria-pressed={preference === option.value}
          aria-label={`Use ${option.label.toLowerCase()} appearance`}
          title={option.label}
          onClick={() => setPreference(option.value)}
        >
          <ThemeIcon theme={option.value} />
          {!compact ? <span>{option.label}</span> : null}
        </button>
      ))}
    </div>
  );
}
