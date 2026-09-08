-- Branding: full theme control + a logo the org can upload itself.
--
-- Before this, branding_settings held two colours (primary/secondary) and a
-- logo_url that nothing could actually write to. The admin console can now set
-- every colour token in the app, so the palette is a JSON blob rather than a
-- column per colour — adding a token later is a code change, not a migration,
-- and an unknown key simply goes unused instead of breaking the read.
--
-- Shape: { "ground": "#051A1D", "magenta": "#911766", ... } keyed by the token
-- names in tailwind.config.js. NULL / missing keys fall back to the compiled
-- defaults, so an empty theme renders exactly as it does today.

alter table public.branding_settings
  add column if not exists theme jsonb;

comment on column public.branding_settings.theme is
  'Colour token overrides keyed by tailwind token name, e.g. {"magenta":"#911766"}. Missing keys fall back to the compiled defaults.';

-- ------------------------------------------------------------------
-- Storage for branding assets (logo, favicon).
--
-- Deliberately NOT the avatars bucket: its policies key writes to
-- (storage.foldername(name))[1] = auth.uid(), which is right for member photos
-- and wrong for org assets. Public read so the logo renders on the login page
-- before anyone signs in; owner-only write.
-- ------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do nothing;

drop policy if exists branding_assets_public_read on storage.objects;
create policy branding_assets_public_read on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'branding');

drop policy if exists branding_assets_owner_write on storage.objects;
create policy branding_assets_owner_write on storage.objects for insert
  to authenticated
  with check (bucket_id = 'branding' and public.is_support_owner());

drop policy if exists branding_assets_owner_update on storage.objects;
create policy branding_assets_owner_update on storage.objects for update
  to authenticated
  using (bucket_id = 'branding' and public.is_support_owner());

drop policy if exists branding_assets_owner_delete on storage.objects;
create policy branding_assets_owner_delete on storage.objects for delete
  to authenticated
  using (bucket_id = 'branding' and public.is_support_owner());
