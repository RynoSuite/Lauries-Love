import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// Step 1 of password recovery: ask Supabase to send the recovery email.
//
// This is the page the migration campaign should link to. The newsletter
// platform cannot embed a working reset link itself — Supabase recovery tokens
// are minted per request and expire — so the campaign links here, the member
// enters their address, and Supabase sends the real token.
//
// Always reports success, even for an address with no account. Saying "no
// account found" would turn this into an oracle for enumerating the
// membership of a cancer-support community, which is exactly the kind of
// disclosure this app's privacy model exists to prevent.
export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: `${window.location.origin}/reset-password` },
      );
      // A rate-limit is worth surfacing; anything else is swallowed so the
      // response cannot be used to probe which addresses exist.
      if (err && err.status === 429) throw err;
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? 'Too many attempts just now, please wait a minute and try again.'
          : 'Something went wrong.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-ground px-4">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-8 shadow-lg ring-1 ring-line">
        <div className="mb-5 flex flex-col items-center text-center">
          <img src="/logo.png" alt="" className="mb-2 h-16 w-16 object-contain" />
          <h1 className="font-serif text-2xl font-semibold text-heading">
            Reset your password
          </h1>
          <hr className="my-3 h-[3px] w-24 rounded-full border-0 bg-magenta" />
        </div>

        {sent ? (
          <>
            <p className="text-sm leading-relaxed text-muted">
              If there is an account for <span className="text-heading">{email}</span>,
              we have sent it a reset link and a 6-digit code. Check your inbox,
              and your spam folder if it is not there.
            </p>
            <Link
              to="/reset-password"
              className="mt-4 flex w-full items-center justify-center rounded-lg bg-magenta py-2.5 font-semibold text-white transition-colors hover:bg-magenta-hi"
            >
              I have a code
            </Link>
            <Link
              to="/login"
              className="mt-3 block text-center text-sm text-magenta-text hover:underline"
            >
              Back to sign in
            </Link>
          </>
        ) : (
          <form onSubmit={onSubmit}>
            <p className="mb-4 text-sm leading-relaxed text-muted">
              Enter the email address on your account and we will send you a
              link to set a new password.
            </p>
            <label className="mb-1 block text-sm font-medium text-heading">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="mb-4 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-magenta focus:ring-1 focus:ring-magenta"
            />
            {error && <p className="mb-3 text-sm text-danger">{error}</p>}
            <button
              disabled={busy || !email.trim()}
              className="w-full rounded-lg bg-magenta py-2.5 font-semibold text-white transition-colors hover:bg-magenta-hi disabled:opacity-60"
            >
              {busy ? 'Sending…' : 'Send reset link'}
            </button>
            <Link
              to="/login"
              className="mt-4 block text-center text-sm text-magenta-text hover:underline"
            >
              Back to sign in
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
