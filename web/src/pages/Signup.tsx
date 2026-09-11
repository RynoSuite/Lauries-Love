import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { AuthLayout, AUTH_POINTS } from '../components/AuthLayout';

// Self-serve member signup for the web app. Creates the account (profile is
// auto-provisioned by the handle_new_user trigger); members can fill in the
// rest of their profile from the Profile page after they're in.
export function Signup() {
  const { signUp, session } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sentConfirmation, setSentConfirmation] = useState(false);

  if (session) navigate('/', { replace: true });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      const { needsConfirmation } = await signUp(email, password, name.trim());
      if (needsConfirmation) setSentConfirmation(true);
      // Straight into onboarding: the account exists, and this is the one
      // moment someone is willing to answer questions about themselves.
      else navigate('/welcome', { replace: true });
    } catch (err) {
      setError((err as Error).message || 'Could not create your account.');
    } finally {
      setBusy(false);
    }
  }

  if (sentConfirmation) {
    return (
      <AuthLayout>
        <h2 className="font-serif text-2xl text-heading">Check your email</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          We sent a confirmation link to{' '}
          <strong className="text-heading">{email}</strong>. Confirm it, then
          sign in.
        </p>
        <Link
          to="/login"
          className="mt-6 block rounded-lg bg-magenta py-3 text-center font-semibold text-white transition-colors hover:bg-magenta-hi"
        >
          Go to sign in
        </Link>
      </AuthLayout>
    );
  }

  const field =
    'mb-4 w-full rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-heading outline-none transition-colors placeholder:text-faint focus:border-magenta focus:ring-1 focus:ring-magenta';

  return (
    <AuthLayout points={AUTH_POINTS}>
      <h2 className="font-serif text-2xl text-heading">Create your account</h2>
      <p className="mt-1 text-sm text-muted">
        It takes a minute, and you choose what you share.
      </p>

      <form onSubmit={onSubmit} className="mt-6">
        <label
          htmlFor="signup-name"
          className="mb-1 block text-sm font-medium text-heading"
        >
          Name
        </label>
        <input
          id="signup-name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className={field}
        />

        <label
          htmlFor="signup-email"
          className="mb-1 block text-sm font-medium text-heading"
        >
          Email
        </label>
        <input
          id="signup-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={field}
        />

        <label
          htmlFor="signup-password"
          className="mb-1 block text-sm font-medium text-heading"
        >
          Password
        </label>
        <input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="mb-1 w-full rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-heading outline-none transition-colors focus:border-magenta focus:ring-1 focus:ring-magenta"
        />
        {/* Stated before the attempt rather than as an error after it. */}
        <p className="mb-4 text-xs text-faint">At least 6 characters.</p>

        {error && (
          <p role="alert" className="mb-3 text-sm text-danger">
            {error}
          </p>
        )}

        <button
          disabled={busy}
          className="w-full rounded-lg bg-magenta py-3 font-semibold text-white transition-colors hover:bg-magenta-hi disabled:opacity-60"
        >
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 border-t border-line pt-5 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold text-magenta-text hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
