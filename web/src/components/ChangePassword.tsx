import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Change your password while signed in.
//
// The app had a reset-by-email flow and nothing else, so a member who was
// logged in and simply wanted a new password had to log out, ask for an email,
// and wait for mail that this project cannot yet send: SMTP is not configured.
// That is a dead end from inside the app.
//
// The current password is checked before the change. Supabase does not require
// it — an active session is enough — but not asking means an unattended laptop
// is a permanent account takeover rather than a session someone can end.
export function ChangePassword() {
  const [email, setEmail] = useState<string | null>(null);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // The address that actually signs in. profiles_private.email is editable
  // separately and can drift from it, so showing that one here would tell
  // someone to log in with an address that does not work.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function submit() {
    setErr(null);
    if (next.length < 8) {
      setErr('Use at least 8 characters.');
      return;
    }
    if (next !== confirm) {
      setErr('The new passwords do not match.');
      return;
    }
    if (!email) {
      setErr('Could not read your account. Reload and try again.');
      return;
    }

    setBusy(true);
    // Re-authenticate. This also catches the case where someone has the page
    // open on a session they did not create.
    const { error: authErr } = await supabase.auth.signInWithPassword({
      email,
      password: current,
    });
    if (authErr) {
      setBusy(false);
      setErr('That is not your current password.');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: next });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setCurrent('');
    setNext('');
    setConfirm('');
    setDone(true);
  }

  const input =
    'w-full rounded-lg border border-line-strong px-3 py-2 text-sm outline-none focus:border-magenta';

  return (
    <div className="mt-6 rounded-2xl border border-line bg-surface p-5">
      <h2 className="mb-1 font-sans text-sm font-semibold text-magenta-text">
        Password
      </h2>
      {email && (
        <p className="mb-3 text-xs text-faint">
          You sign in as <span className="text-body">{email}</span>. The same
          email and password work in the mobile app.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-heading">Current</span>
          <input
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className={input}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-heading">New</span>
          <input
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className={input}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-heading">Confirm new</span>
          <input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void submit();
            }}
            className={input}
          />
        </label>
      </div>

      {err && <p className="mt-3 text-sm text-danger">{err}</p>}
      {done && (
        <p className="mt-3 text-sm text-success">
          Password changed. Use it next time you sign in, here or on the app.
        </p>
      )}

      <button
        onClick={submit}
        disabled={busy || !current || !next || !confirm}
        className="mt-4 rounded-lg bg-magenta px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-magenta-hi disabled:opacity-50"
      >
        {busy ? 'Changing…' : 'Change password'}
      </button>
    </div>
  );
}
