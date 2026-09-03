import { useState } from 'react';
import { useFeatureFlags } from '../lib/featureFlags';
import { supabase, currentUserId } from '../lib/supabase';

// Donations. One-time or monthly recurring. Checkout runs through a Stripe
// edge function (stripe-create-checkout-session) that activates once the Stripe
// account + keys are connected. Until then the button explains that clearly
// rather than failing silently.
const PRESETS = [10, 25, 50, 100, 250];

// "What your donation covers" — simple education calculator.
function coverage(amount: number): string {
  if (amount >= 250) return 'Helps host community events and outreach for a month.';
  if (amount >= 100) return 'Covers platform + messaging costs for dozens of members.';
  if (amount >= 50) return 'Keeps the community running for many members this month.';
  if (amount >= 25) return 'Supports a member’s access to the community for a month.';
  return 'Every dollar helps keep Laurie’s Love free for members.';
}

export function Donate() {
  const { isEnabled } = useFeatureFlags();
  const [amount, setAmount] = useState(25);
  const [recurring, setRecurring] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  async function donate() {
    setStatus(null);
    setLoading(true);
    const me = await currentUserId();
    try {
      // The edge function returns a Stripe Checkout URL once configured. If it
      // isn't (503 / not-configured / any error), fall through to the pending
      // message rather than surfacing a raw error.
      const { data, error } = await supabase.functions.invoke('stripe-create-checkout-session', {
        body: { amount, recurring, profile_id: me },
      });
      if (error) throw error;
      const url = (data as { url?: string } | null)?.url;
      if (url) {
        window.location.href = url;
        return;
      }
      setStatus('Donations aren’t connected yet — Stripe setup is pending.');
    } catch {
      setStatus('Donations aren’t connected yet — Stripe setup is pending.');
    } finally {
      setLoading(false);
    }
  }

  if (!isEnabled('donations'))
    return <p className="text-muted">Donations are turned off.</p>;

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-1 text-xl font-bold text-heading">Support Laurie’s Love</h1>
      <p className="mb-5 text-sm text-muted">
        Your gift keeps the community free for members.
      </p>

      <div className="mb-4 flex rounded-full bg-surface-2 p-1 text-sm">
        <button
          onClick={() => setRecurring(false)}
          className={`flex-1 rounded-full py-2 ${!recurring ? 'bg-magenta text-white' : 'text-heading'}`}
        >
          One-time
        </button>
        <button
          onClick={() => setRecurring(true)}
          className={`flex-1 rounded-full py-2 ${recurring ? 'bg-magenta text-white' : 'text-heading'}`}
        >
          Monthly
        </button>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => setAmount(p)}
            className={`rounded-lg border py-2 font-semibold ${
              amount === p ? 'border-magenta bg-surface-2 text-heading' : 'border-line'
            }`}
          >
            ${p}
          </button>
        ))}
      </div>
      <input
        type="number"
        min={1}
        value={amount}
        onChange={(e) => setAmount(Math.max(1, Number(e.target.value) || 0))}
        className="mb-3 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-magenta"
      />

      <div className="mb-4 rounded-lg bg-surface-2 p-3 text-sm text-heading">
        {coverage(amount)}
      </div>

      <button
        onClick={donate}
        disabled={loading}
        className="w-full rounded-lg bg-magenta py-3 font-semibold text-white hover:bg-magenta-hi disabled:opacity-50"
      >
        {loading
          ? 'Redirecting…'
          : recurring
            ? `Give $${amount}/month`
            : `Give $${amount}`}
      </button>
      {status && <p className="mt-3 text-center text-sm text-warn">{status}</p>}
    </div>
  );
}
