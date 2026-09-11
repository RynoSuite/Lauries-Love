import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AuthLayout } from '../components/AuthLayout';

// Step 2 of password recovery. Handles BOTH routes into this page, because the
// two surfaces send people here differently and one email template serves both:
//
//   · Link  — the member clicked {{ .ConfirmationURL }}. supabase-js parses the
//     recovery token out of the URL fragment on load and emits
//     PASSWORD_RECOVERY, so a session already exists and we only ask for the
//     new password.
//   · Code  — the member has the 6-digit {{ .Token }} instead. This is the flow
//     the mobile app uses (sbConfirmPasswordReset), and it also covers the very
//     common case of requesting on a laptop but opening mail on a phone.
//
// Supabase enforces its own password policy server-side; the length check here
// is only so the member gets told before a round trip.
const MIN_LENGTH = 8;

export function ResetPassword() {
  const navigate = useNavigate();
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [checking, setChecking] = useState(true);

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // A recovery link puts a session in place before this effect runs, but the
    // event can also land a tick later — listen as well as check.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setHasRecoverySession(true);
        setChecking(false);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setHasRecoverySession(true);
      setChecking(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  function validate(): string | null {
    if (password.length < MIN_LENGTH)
      return `Password must be at least ${MIN_LENGTH} characters.`;
    if (password !== confirm) return 'The two passwords do not match.';
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // Code path: exchange the 6-digit token for a session first. Same call
      // the mobile app makes, so one email template serves both surfaces.
      if (!hasRecoverySession) {
        const { error: otpErr } = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: code.trim(),
          type: 'recovery',
        });
        if (otpErr) throw otpErr;
      }
      const { error: updErr } = await supabase.auth.updateUser({ password });
      if (updErr) throw updErr;
      setDone(true);
      setTimeout(() => navigate('/'), 1800);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not set the password. The code may have expired.',
      );
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    'mb-4 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-magenta focus:ring-1 focus:ring-magenta';

  return (
    <AuthLayout>
      <h2 className="mb-5 font-serif text-2xl text-heading">Choose a new password</h2>

        {done ? (
          <p className="text-center text-sm leading-relaxed text-muted">
            Your password is set. Taking you to the community…
          </p>
        ) : checking ? (
          <p className="text-center text-sm text-muted">Checking your link…</p>
        ) : (
          <form onSubmit={onSubmit}>
            {!hasRecoverySession && (
              <>
                <p className="mb-4 text-sm leading-relaxed text-muted">
                  Enter the email on your account and the 6-digit code we sent
                  you.
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
                  className={inputClass}
                />
                <label className="mb-1 block text-sm font-medium text-heading">
                  6-digit code
                </label>
                <input
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  maxLength={6}
                  required
                  autoComplete="one-time-code"
                  className={inputClass + ' tracking-[0.4em]'}
                />
              </>
            )}

            <label className="mb-1 block text-sm font-medium text-heading">
              New password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className={inputClass}
            />
            <label className="mb-1 block text-sm font-medium text-heading">
              Confirm new password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              className={inputClass}
            />

            {error && <p className="mb-3 text-sm text-danger">{error}</p>}

            <button
              disabled={busy}
              className="w-full rounded-lg bg-magenta py-2.5 font-semibold text-white transition-colors hover:bg-magenta-hi disabled:opacity-60"
            >
              {busy ? 'Saving…' : 'Set password'}
            </button>
            <Link
              to="/forgot-password"
              className="mt-4 block text-center text-sm text-magenta-text hover:underline"
            >
              Send me a new link
            </Link>
          </form>
        )}
    </AuthLayout>
  );
}
