import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { AuthLayout, AUTH_POINTS } from '../components/AuthLayout';

export function Login() {
  const { signIn, session } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (session) navigate('/', { replace: true });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signIn(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError((err as Error).message || 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout points={AUTH_POINTS}>
      <h2 className="font-serif text-2xl text-heading">Welcome back</h2>
      <p className="mt-1 text-sm text-muted">
        Sign in to pick up where you left off.
      </p>

      <form onSubmit={onSubmit} className="mt-6">
        <label
          htmlFor="login-email"
          className="mb-1 block text-sm font-medium text-heading"
        >
          Email
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mb-4 w-full rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-heading outline-none transition-colors placeholder:text-faint focus:border-magenta focus:ring-1 focus:ring-magenta"
        />

        <div className="mb-1 flex items-baseline justify-between">
          <label
            htmlFor="login-password"
            className="block text-sm font-medium text-heading"
          >
            Password
          </label>
          {/* Beside the field it belongs to, where it is looked for, rather
              than under the button after the attempt has already failed. */}
          <Link
            to="/forgot-password"
            className="text-sm text-magenta-text hover:underline"
          >
            Forgot it?
          </Link>
        </div>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mb-4 w-full rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-heading outline-none transition-colors focus:border-magenta focus:ring-1 focus:ring-magenta"
        />

        {error && (
          <p role="alert" className="mb-3 text-sm text-danger">
            {error}
          </p>
        )}

        <button
          disabled={busy}
          className="w-full rounded-lg bg-magenta py-3 font-semibold text-white transition-colors hover:bg-magenta-hi disabled:opacity-60"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 border-t border-line pt-5 text-center text-sm text-muted">
        New here?{' '}
        <Link
          to="/signup"
          className="font-semibold text-magenta-text hover:underline"
        >
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
