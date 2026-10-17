import { useState } from 'react';

type FormFieldProps = {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password';
  autoComplete: string;
  value: string;
  error?: string;
  onChange(value: string): void;
  readOnly?: boolean;
};

export function FormField({
  id,
  label,
  type = 'text',
  autoComplete,
  value,
  error,
  onChange,
  readOnly,
}: FormFieldProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const errorId = `${id}-error`;
  const isPassword = type === 'password';

  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <div className="field-input-wrap">
        <input
          id={id}
          name={id}
          type={isPassword && isPasswordVisible ? 'text' : type}
          autoComplete={autoComplete}
          value={value}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => onChange(event.target.value)}
          readOnly={readOnly}
        />
        {isPassword ? (
          <button
            className="password-visibility"
            type="button"
            aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
            aria-pressed={isPasswordVisible}
            onClick={() => setIsPasswordVisible((visible) => !visible)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
              <circle cx="12" cy="12" r="2.75" />
              {isPasswordVisible ? null : <path d="m4 4 16 16" />}
            </svg>
          </button>
        ) : null}
      </div>
      {error ? (
        <span className="field-error" id={errorId}>
          {error}
        </span>
      ) : null}
    </div>
  );
}
