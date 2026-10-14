type FormFieldProps = {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password';
  autoComplete: string;
  value: string;
  error?: string;
  onChange(value: string): void;
};

export function FormField({
  id,
  label,
  type = 'text',
  autoComplete,
  value,
  error,
  onChange,
}: FormFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? (
        <span className="field-error" id={errorId}>
          {error}
        </span>
      ) : null}
    </div>
  );
}
