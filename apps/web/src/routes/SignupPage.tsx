import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError, signup } from '../api/auth';
import { useAuth } from '../auth/useAuth';
import { AuthLayout } from '../components/auth/AuthLayout';
import { FormField } from '../components/auth/FormField';

type Fields = 'name' | 'email' | 'password';

export function SignupPage() {
  const navigate = useNavigate();
  const { setAuthenticatedUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<Fields, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setFieldErrors({});

    if (password !== confirmation) {
      setFieldErrors({ password: 'Passwords do not match.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await signup({ name, email, password });
      setAuthenticatedUser(user);
      navigate('/app', { replace: true });
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
        setFieldErrors({
          name: caught.details?.name?.[0],
          email: caught.details?.email?.[0],
          password: caught.details?.password?.[0],
        });
      } else {
        setError('Unable to create your account. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <div className="auth-heading">
        <span className="section-eyebrow">Start planning</span>
        <h1>Create your Vivah account</h1>
        <p>Your account is the first step toward a shared wedding workspace.</p>
      </div>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {error ? (
          <div className="form-alert" role="alert">
            {error}
          </div>
        ) : null}
        <FormField
          id="name"
          label="Full name"
          autoComplete="name"
          value={name}
          error={fieldErrors.name}
          onChange={setName}
        />
        <FormField
          id="email"
          label="Email address"
          type="email"
          autoComplete="email"
          value={email}
          error={fieldErrors.email}
          onChange={setEmail}
        />
        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          value={password}
          error={fieldErrors.password}
          onChange={setPassword}
        />
        <FormField
          id="password-confirmation"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={confirmation}
          error={fieldErrors.password}
          onChange={setConfirmation}
        />
        <p className="password-hint">Use at least 8 characters.</p>
        <button
          className="button button-primary auth-submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="auth-switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </AuthLayout>
  );
}
