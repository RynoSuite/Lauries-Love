import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useFeatureFlags } from '../lib/featureFlags';

// Sponsorship landing page with tiered opportunities (SOW). Tiers + the contact
// address come from org_settings key 'sponsorship' (admin-editable in Platform
// Config); a static default is used until an admin customizes it. "Become a
// sponsor" opens a pre-filled mailto to the configured address.
type Tier = {
  name: string;
  price: string;
  perks: string[];
  featured?: boolean;
};

type SponsorshipConfig = {
  contact_email: string;
  tiers: Tier[];
};

const DEFAULT_CONFIG: SponsorshipConfig = {
  contact_email: 'sponsors@laurieslove.org',
  tiers: [
    {
      name: 'Community Friend',
      price: '$500 / year',
      perks: ['Logo on the sponsors page', 'Thank-you post to the community'],
    },
    {
      name: 'Community Partner',
      price: '$2,500 / year',
      perks: [
        'Everything in Friend',
        'Featured placement on the sponsors page',
        'Quarterly community shout-out',
      ],
      featured: true,
    },
    {
      name: 'Community Champion',
      price: '$10,000 / year',
      perks: [
        'Everything in Partner',
        'Homepage recognition',
        'Named support for a community program',
      ],
    },
  ],
};

async function fetchConfig(): Promise<SponsorshipConfig> {
  const { data } = await supabase
    .from('org_settings')
    .select('value')
    .eq('key', 'sponsorship')
    .maybeSingle();
  const v = data?.value as Partial<SponsorshipConfig> | undefined;
  if (!v) return DEFAULT_CONFIG;
  return {
    contact_email: v.contact_email || DEFAULT_CONFIG.contact_email,
    tiers: v.tiers && v.tiers.length ? v.tiers : DEFAULT_CONFIG.tiers,
  };
}

export function Sponsorships() {
  const { isEnabled } = useFeatureFlags();
  const { data } = useQuery({ queryKey: ['sponsorship-config'], queryFn: fetchConfig });
  const config = data ?? DEFAULT_CONFIG;

  if (!isEnabled('sponsorships'))
    return <p className="text-muted">Sponsorships are turned off.</p>;

  const mailto = (tier: Tier) =>
    `mailto:${config.contact_email}?subject=${encodeURIComponent(
      `Sponsorship interest: ${tier.name}`,
    )}&body=${encodeURIComponent(
      `Hi Laurie's Love team,\n\nI'm interested in the ${tier.name} sponsorship (${tier.price}). Please send me the details.\n\nThanks,`,
    )}`;

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-heading">Become a Sponsor</h1>
        <p className="mt-1 text-sm text-muted">
          Partner with Laurie’s Love to support cancer patients and their families.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {config.tiers.map((t) => (
          <div
            key={t.name}
            className={`rounded-2xl border p-5 ${
              t.featured
                ? 'border-magenta bg-surface-2 shadow-md'
                : 'border-line bg-surface'
            }`}
          >
            <div className="text-lg font-bold text-heading">{t.name}</div>
            <div className="mb-3 text-sm text-magenta-text">{t.price}</div>
            <ul className="space-y-1 text-sm text-muted">
              {t.perks.map((p) => (
                <li key={p}>• {p}</li>
              ))}
            </ul>
            <a
              href={mailto(t)}
              className="mt-4 block w-full rounded-lg bg-magenta py-2 text-center text-sm font-semibold text-white hover:bg-magenta-hi"
            >
              Become a {t.name.split(' ')[1] ?? 'Sponsor'}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
