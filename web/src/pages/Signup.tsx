import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

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
      else navigate('/', { replace: true });
    } catch (err) {
      setError((err as Error).message || 'Could not create your account.');
    } finally {
      setBusy(false);
    }
  }

  if (sentConfirmation) {
    return (
      <div className="grid min-h-screen place-items-center bg-ground px-4">
        <div className="w-full max-w-sm rounded-2xl bg-surface p-8 text-center shadow-lg">
          <h1 className="mb-2 text-xl font-bold text-heading">Check your email</h1>
          <p className="text-sm text-muted">
            We sent a confirmation link to <strong>{email}</strong>. Confirm it, then
            sign in.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block rounded-lg bg-magenta px-4 py-2 text-sm font-semibold text-white hover:bg-magenta-hi"
          >
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen place-items-center bg-ground px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl bg-surface p-8 shadow-lg">
        <h1 className="mb-1 text-2xl font-bold text-heading">Laurie’s Love</h1>
        <p className="mb-6 text-sm text-muted">Create your community account.</p>

        <label className="mb-1 block text-sm font-medium">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mb-4 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-magenta"
        />
        <label className="mb-1 block text-sm font-medium">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mb-4 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-magenta"
        />
        <label className="mb-1 block text-sm font-medium">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="mb-4 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-magenta"
        />
        {error && <p className="mb-3 text-sm text-danger">{error}</p>}
        <button
          disabled={busy}
          className="w-full rounded-lg bg-magenta py-2 font-semibold text-white hover:bg-magenta-hi disabled:opacity-60"
        >
          {busy ? 'Creating account…' : 'Create account'}
        </button>
        <p className="mt-4 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-heading hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
