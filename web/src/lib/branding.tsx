import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from './supabase';
import { applyTheme } from './theme';

// Runtime branding. Loads the single branding_settings row (public read, so it
// works before sign-in too) and exposes app name / tagline / logo, plus paints
// the org's colour overrides onto the document as CSS variables.
type Branding = {
  appName: string;
  tagline: string | null;
  logoUrl: string | null;
  supportEmail: string | null;
  theme: Record<string, string> | null;
  loaded: boolean;
};

const DEFAULT_BRANDING: Branding = {
  appName: 'Laurie’s Love',
  tagline: 'So no warrior ever walks alone.',
  logoUrl: '/logo.png',
  supportEmail: null,
  theme: null,
  loaded: false,
};

const BrandingContext = createContext<Branding>(DEFAULT_BRANDING);
export const useBranding = () => useContext(BrandingContext);

type Row = {
  app_name: string | null;
  tagline: string | null;
  logo_url: string | null;
  support_email: string | null;
  // Present only once 20260908120000_branding_theme_v1 has been applied.
  theme?: Record<string, string> | null;
};

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<Branding>(DEFAULT_BRANDING);

  useEffect(() => {
    let active = true;
    // select('*') rather than a column list: the theme column may not exist on
    // an environment that has not run the branding migration yet, and naming it
    // explicitly would make the whole query fail there.
    supabase
      .from('branding_settings')
      .select('*')
      .maybeSingle()
      .then(({ data }) => {
        if (!active || !data) {
          setBranding((b) => ({ ...b, loaded: true }));
          return;
        }
        const row = data as Row;
        setBranding({
          appName: row.app_name?.trim() || DEFAULT_BRANDING.appName,
          tagline: row.tagline?.trim() || DEFAULT_BRANDING.tagline,
          // Fall back to the bundled mark, not null. An org row exists long
          // before anyone uploads a logo, and `|| null` previously made
          // DEFAULT_BRANDING.logoUrl unreachable — the header silently dropped
          // to a placeholder icon instead of the real gold L♥L mark.
          logoUrl: row.logo_url?.trim() || DEFAULT_BRANDING.logoUrl,
          supportEmail: row.support_email?.trim() || null,
          theme: row.theme ?? null,
          loaded: true,
        });
      });
    return () => {
      active = false;
    };
  }, []);

  // Paint the palette. Runs on every change so the admin console's live
  // preview and a normal page load go through exactly the same path.
  useEffect(() => {
    applyTheme(branding.theme);
  }, [branding.theme]);

  useEffect(() => {
    document.title = branding.appName;
  }, [branding.appName]);

  return (
    <BrandingContext.Provider value={branding}>{children}</BrandingContext.Provider>
  );
}
