import { supabase } from '../lib/supabase';

// One avatar for the whole app: photo when the member has one, their initial
// on a magenta disc when they don't. Every surface that showed a bare initial
// uses this, so uploading a photo replaces it everywhere at once.
//
// `path` is the profiles.avatar_path column — a storage key like
// "<uid>/1712345678.jpg", the same convention the mobile app writes, so a photo
// set on either surface shows on both. A full http(s) URL is passed through
// untouched for any legacy rows that stored one.
export function avatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl ?? null;
}

export function initialOf(name: string | null | undefined): string {
  const t = (name ?? '').trim();
  return t ? t[0].toUpperCase() : 'M';
}

export function Avatar({
  path,
  name,
  size = 36,
  className = '',
}: {
  path?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}) {
  const url = avatarUrl(path);
  const style = { width: size, height: size };

  if (url) {
    return (
      <img
        src={url}
        alt=""
        style={style}
        className={'shrink-0 rounded-full object-cover ' + className}
      />
    );
  }

  return (
    <span
      style={{ ...style, fontSize: Math.max(11, Math.round(size * 0.4)) }}
      aria-hidden="true"
      className={
        'grid shrink-0 place-items-center rounded-full bg-magenta font-semibold text-white ' +
        className
      }
    >
      {initialOf(name)}
    </span>
  );
}
