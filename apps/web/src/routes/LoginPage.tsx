import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ApiError, login } from '../api/auth';
import { useAuth } from '../auth/useAuth';
import { AuthLayout } from '../components/auth/AuthLayout';
import { FormField } from '../components/auth/FormField';

type Fields = 'email' | 'password';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuthenticatedUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<Fields, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const user = await login({ email, password });
      setAuthenticatedUser(user);
      const destination =
        typeof location.state === 'object' &&
        location.state &&
        'from' in location.state &&
        typeof location.state.from === 'string'
          ? location.state.from
          : '/app';
      navigate(destination, { replace: true });
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
        setFieldErrors({
          email: caught.details?.email?.[0],
          password: caught.details?.password?.[0],
        });
      } else {
        setError('Unable to log in. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <div className="auth-heading">
        <span className="section-eyebrow">Welcome back</span>
        <h1>Log in to Vivah</h1>
        <p>Continue planning with your family in one private workspace.</p>
      </div>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {error ? (
          <div className="form-alert" role="alert">
            {error}
          </div>
        ) : null}
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
          autoComplete="current-password"
          value={password}
          error={fieldErrors.password}
          onChange={setPassword}
        />
        <button
          className="button button-primary auth-submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="auth-switch">
        New to Vivah? <Link to="/signup">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
