import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, currentOrgId } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { PageTitle } from '../../components/PageTitle';
import { ColorField } from '../../components/ColorField';
import {
  ALL_TOKENS,
  DEFAULT_THEME,
  THEME_GROUPS,
  applyTheme,
  contrastRatio,
} from '../../lib/theme';

// Branding console. Owners can set the app's name and copy, upload a logo, and
// repaint every colour token in the app.
//
// Colours preview live: edits are written straight to the document's CSS
// variables, so the surrounding admin UI recolours as you drag the picker.
// Nothing is persisted until Save, and leaving the page without saving
// restores whatever is in the database.

type Row = {
  app_name: string | null;
  tagline: string | null;
  logo_url: string | null;
  support_email: string | null;
  theme?: Record<string, string> | null;
};

type Text = { app_name: string; tagline: string; support_email: string; logo_url: string };

const EMPTY_TEXT: Text = { app_name: '', tagline: '', support_email: '', logo_url: '' };

async function fetchBranding(): Promise<Row | null> {
  // select('*') so this still works before the theme migration is applied.
  const { data } = await supabase.from('branding_settings').select('*').maybeSingle();
  return (data as Row) ?? null;
}

export function AdminBranding() {
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ['branding'], queryFn: fetchBranding });

  const [text, setText] = useState<Text>(EMPTY_TEXT);
  const [theme, setTheme] = useState<Record<string, string>>(DEFAULT_THEME);
  const [dirty, setDirty] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!data) return;
    setText({
      app_name: data.app_name ?? '',
      tagline: data.tagline ?? '',
      support_email: data.support_email ?? '',
      logo_url: data.logo_url ?? '',
    });
    setTheme({ ...DEFAULT_THEME, ...(data.theme ?? {}) });
  }, [data]);

  // Live preview. On unmount, drop back to whatever is saved so an abandoned
  // edit does not leave the rest of the admin console repainted.
  useEffect(() => {
    if (dirty) applyTheme(theme);
  }, [theme, dirty]);
  useEffect(
    () => () => {
      applyTheme(data?.theme ?? null);
    },
    [data],
  );

  const setToken = (key: string, hex: string) => {
    setDirty(true);
    setTheme((t) => ({ ...t, [key]: hex }));
  };

  const save = useMutation({
    mutationFn: async () => {
      const orgId = await currentOrgId();
      if (!orgId) throw new Error('No organisation found');
      // Store only what differs from the defaults. Keeps the row small and
      // means a future change to a default reaches orgs that never touched it.
      const overrides: Record<string, string> = {};
      for (const t of ALL_TOKENS) {
        if (theme[t.key] && theme[t.key].toUpperCase() !== t.default.toUpperCase()) {
          overrides[t.key] = theme[t.key].toUpperCase();
        }
      }
      const { error } = await supabase.from('branding_settings').upsert(
        {
          org_id: orgId,
          app_name: text.app_name.trim() || null,
          tagline: text.tagline.trim() || null,
          support_email: text.support_email.trim() || null,
          logo_url: text.logo_url.trim() || null,
          theme: Object.keys(overrides).length ? overrides : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'org_id' },
      );
      if (error) {
        // The most likely failure by far is that the branding migration has
        // not been run on this environment. PostgREST reports that as a
        // schema-cache miss, which reads as gibberish to anyone who is not a
        // developer — so say what it actually means.
        if (/theme/i.test(error.message) || error.code === 'PGRST204') {
          throw new Error(
            'the database is missing the theme column. Run the branding migration ' +
              '(supabase/migrations/20260908120000_branding_theme_v1.sql) on this project, then try again.',
          );
        }
        throw error;
      }
    },
    onSuccess: () => {
      setDirty(false);
      qc.invalidateQueries({ queryKey: ['branding'] });
    },
  });

  async function onLogoPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadErr(null);
    if (!file.type.startsWith('image/')) {
      setUploadErr('Please choose an image file.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setUploadErr('Please choose an image under 4MB.');
      return;
    }
    setBusy(true);
    try {
      const ext = (file.name.split('.').pop() || 'png').toLowerCase().slice(0, 4);
      const path = `logo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('branding')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('branding').getPublicUrl(path);
      setText((t) => ({ ...t, logo_url: pub.publicUrl }));
      setDirty(true);
    } catch (err) {
      setUploadErr(
        err instanceof Error
          ? `${err.message} — if this mentions a missing bucket, the branding migration has not been applied yet.`
          : 'Upload failed.',
      );
    } finally {
      setBusy(false);
    }
  }

  if (!isAdmin)
    return <p className="text-muted">Owner access is required to edit branding.</p>;
  if (isLoading) return <p className="text-heading">Loading…</p>;

  const inputClass =
    'w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-magenta';

  // Warn when brand text would be unreadable on a card. Cheap guard against an
  // enthusiastic colour choice making the app unusable for everyone.
  const brandTextContrast = contrastRatio(theme['magenta-text'], theme['surface']);
  const bodyContrast = contrastRatio(theme['body'], theme['surface']);

  return (
    <div className="max-w-3xl">
      <PageTitle
        actions={
          <div className="flex items-center gap-2">
            {dirty && <span className="text-xs text-warn">Unsaved changes</span>}
            <button
              onClick={() => save.mutate()}
              disabled={save.isPending || !dirty}
              className="rounded-lg bg-magenta px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-magenta-hi disabled:opacity-50"
            >
              {save.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        }
      >
        Branding
      </PageTitle>

      {save.isError && (
        <p className="mb-4 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {(save.error as Error).message}
        </p>
      )}

      {/* ── Identity ─────────────────────────────────────────────── */}
      <section className="mb-6 rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-1 font-sans text-sm font-semibold text-magenta-text">Identity</h2>
        <p className="mb-4 text-sm text-muted">
          The name and words members see. These apply to the web app and the mobile
          apps.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ['app_name', 'App name', "Laurie’s Love"],
              ['tagline', 'Tagline', 'So no warrior ever walks alone.'],
              ['support_email', 'Support email', 'info@laurieslove.org'],
            ] as const
          ).map(([key, label, placeholder]) => (
            <label key={key} className="block">
              <span className="mb-1 block text-sm font-medium text-heading">{label}</span>
              <input
                value={text[key]}
                placeholder={placeholder}
                onChange={(e) => {
                  setDirty(true);
                  setText((t) => ({ ...t, [key]: e.target.value }));
                }}
                className={inputClass}
              />
            </label>
          ))}
        </div>
      </section>

      {/* ── Logo ─────────────────────────────────────────────────── */}
      <section className="mb-6 rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-1 font-sans text-sm font-semibold text-magenta-text">Logo</h2>
        <p className="mb-4 text-sm text-muted">
          Shown in the header, on the sign-in screen, and as the browser tab icon.
          A square image with a transparent background works best.
        </p>

        <div className="flex flex-wrap items-center gap-5">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-xl border border-line bg-ground">
            <img
              src={text.logo_url || '/logo.png'}
              alt=""
              className="h-16 w-16 object-contain"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="rounded-lg bg-magenta px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-magenta-hi disabled:opacity-50"
            >
              {busy ? 'Uploading…' : 'Upload a logo'}
            </button>
            {text.logo_url && (
              <button
                type="button"
                onClick={() => {
                  setDirty(true);
                  setText((t) => ({ ...t, logo_url: '' }));
                }}
                className="rounded-lg border border-line px-3 py-2 text-sm text-muted transition-colors hover:text-danger"
              >
                Use the default
              </button>
            )}
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onLogoPicked}
          className="hidden"
        />
        {uploadErr && <p className="mt-3 text-sm text-danger">{uploadErr}</p>}
      </section>

      {/* ── Colours ──────────────────────────────────────────────── */}
      <section className="mb-6 rounded-2xl border border-line bg-surface p-5">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-sans text-sm font-semibold text-magenta-text">Colours</h2>
          <button
            type="button"
            onClick={() => {
              setDirty(true);
              setTheme({ ...DEFAULT_THEME });
            }}
            className="text-xs text-muted hover:text-heading hover:underline"
          >
            Reset all to default
          </button>
        </div>
        <p className="mb-2 text-sm text-muted">
          Changes preview instantly across this page. Nothing is applied for members
          until you save.
        </p>

        {(brandTextContrast !== null && brandTextContrast < 4.5) ||
        (bodyContrast !== null && bodyContrast < 4.5) ? (
          <p className="mb-4 rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-sm text-warn">
            Some text may be hard to read against the card background
            {brandTextContrast !== null && brandTextContrast < 4.5
              ? ` (brand text is ${brandTextContrast.toFixed(1)}:1`
              : ` (body text is ${bodyContrast?.toFixed(1)}:1`}
            , below the 4.5:1 recommended minimum). Members with low vision may
            struggle.
          </p>
        ) : null}

        <div className="space-y-6">
          {THEME_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-heading">{group.title}</h3>
              <p className="mb-1 text-xs text-faint">{group.blurb}</p>
              <div className="divide-y divide-line">
                {group.tokens.map((token) => (
                  <ColorField
                    key={token.key}
                    label={token.label}
                    hint={token.hint}
                    value={theme[token.key] ?? token.default}
                    defaultValue={token.default}
                    onChange={(hex) => setToken(token.key, hex)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* The save button is repeated at the bottom, so the failure has to be
          repeated with it — otherwise a save that errors at the top of a long
          page just looks like nothing happened. */}
      {save.isError && (
        <p className="mb-3 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          Could not save: {(save.error as Error).message}
        </p>
      )}
      {save.isSuccess && !dirty && (
        <p className="mb-3 text-sm text-success">Saved. Members will see this now.</p>
      )}

      <div className="flex items-center gap-3 pb-10">
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending || !dirty}
          className="rounded-lg bg-magenta px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-magenta-hi disabled:opacity-50"
        >
          {save.isPending ? 'Saving…' : 'Save changes'}
        </button>
        {dirty && (
          <button
            onClick={() => {
              setTheme({ ...DEFAULT_THEME, ...(data?.theme ?? {}) });
              setText({
                app_name: data?.app_name ?? '',
                tagline: data?.tagline ?? '',
                support_email: data?.support_email ?? '',
                logo_url: data?.logo_url ?? '',
              });
              applyTheme(data?.theme ?? null);
              setDirty(false);
            }}
            className="text-sm text-muted hover:text-heading hover:underline"
          >
            Discard changes
          </button>
        )}
      </div>
    </div>
  );
}
