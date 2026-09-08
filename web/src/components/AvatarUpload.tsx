import { useRef, useState } from 'react';
import { supabase, currentUserId } from '../lib/supabase';
import { useRefreshMyAvatar } from '../lib/useMyAvatar';
import { Avatar } from './Avatar';

const MAX_SOURCE_BYTES = 12 * 1024 * 1024; // reject before decoding
const MAX_EDGE = 512; // stored size; the largest place we render is 96px
const JPEG_QUALITY = 0.85;

// Squares and downscales in the browser before upload. A phone photo is
// routinely 4-8MB and 4000px wide; the biggest place this renders is 96px, so
// uploading the original would waste the member's data and the storage bucket
// for no visible gain. Centre-crops to a square first so the circular mask
// never lops off half a face.
async function toSquareJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const edge = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - edge) / 2;
  const sy = (bitmap.height - edge) / 2;
  const out = Math.min(edge, MAX_EDGE);

  const canvas = document.createElement('canvas');
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not prepare the image');
  ctx.drawImage(bitmap, sx, sy, edge, edge, 0, 0, out, out);
  bitmap.close?.();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
  );
  if (!blob) throw new Error('Could not prepare the image');
  return blob;
}

export function AvatarUpload({
  currentPath,
  name,
}: {
  currentPath: string | null | undefined;
  name: string | null | undefined;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const refresh = useRefreshMyAvatar();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // let the same file be re-picked after an error
    if (!file) return;

    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      setError('That image is over 12MB, please pick a smaller one.');
      return;
    }

    setBusy(true);
    try {
      const me = await currentUserId();
      if (!me) throw new Error('Not signed in');

      const blob = await toSquareJpeg(file);
      // Storage policy requires the first path segment to be the uploader's
      // uid. Same shape the mobile app writes, so photos work on both.
      const path = `${me}/${Date.now()}.jpg`;

      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { contentType: 'image/jpeg', upsert: false });
      if (upErr) throw upErr;

      const { error: rowErr } = await supabase
        .from('profiles')
        .update({ avatar_path: path })
        .eq('id', me);
      if (rowErr) throw rowErr;

      // Best-effort cleanup of the previous file so the bucket doesn't collect
      // orphans. Never fatal — the new avatar is already live at this point.
      if (currentPath && !currentPath.startsWith('http') && currentPath !== path) {
        await supabase.storage.from('avatars').remove([currentPath]);
      }

      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  }

  async function onRemove() {
    setError(null);
    setBusy(true);
    try {
      const me = await currentUserId();
      if (!me) throw new Error('Not signed in');
      const { error: rowErr } = await supabase
        .from('profiles')
        .update({ avatar_path: null })
        .eq('id', me);
      if (rowErr) throw rowErr;
      if (currentPath && !currentPath.startsWith('http')) {
        await supabase.storage.from('avatars').remove([currentPath]);
      }
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove the photo.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <Avatar path={currentPath} name={name} size={96} />
        {busy && (
          <span className="absolute inset-0 grid place-items-center rounded-full bg-ground/70 text-xs text-heading">
            Saving…
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="rounded-lg bg-magenta px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-magenta-hi disabled:opacity-50"
        >
          {currentPath ? 'Change photo' : 'Add photo'}
        </button>
        {currentPath && (
          <button
            type="button"
            onClick={onRemove}
            disabled={busy}
            className="rounded-lg border border-line px-3 py-1.5 text-sm text-muted transition-colors hover:text-danger disabled:opacity-50"
          >
            Remove
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onPick}
        className="hidden"
      />

      {error && <p className="mt-2 text-center text-sm text-danger">{error}</p>}
    </div>
  );
}
