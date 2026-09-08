import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, currentUserId } from '../lib/supabase';
import { ConfirmDialog } from './ConfirmDialog';
import { IconMore, IconPencil, IconTrash } from './Icons';

// Edit and delete controls for a post the signed-in member wrote.
//
// The database has allowed authors to update and delete their own posts since
// the initial schema; there was simply no way to do either from the web app,
// so a typo was permanent and a post shared by mistake could not be taken
// back. In a community where people write about their diagnosis, "I cannot
// unsend that" is a genuine problem rather than a missing nicety.
//
// Editing covers the image as well as the text: replacing or removing the
// photo without deleting and reposting, which would lose the comments.

export function PostActions({
  postId,
  authorId,
  body,
  imagePath,
  onChanged,
}: {
  postId: string;
  authorId: string | undefined;
  body: string;
  imagePath: string | null;
  onChanged?: () => void;
}) {
  const qc = useQueryClient();
  const [meId, setMeId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState(body);
  const [draftImage, setDraftImage] = useState<string | null>(imagePath);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    currentUserId().then(setMeId);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['feed'] });
    void qc.invalidateQueries({ queryKey: ['group-posts'] });
    onChanged?.();
  };

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('posts')
        .update({
          body: draft.trim(),
          image_path: draftImage,
          edited_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', postId);
      if (error) {
        if (/edited_at/.test(error.message)) {
          throw new Error(
            'The edit migration has not been run on this project yet (20260908200000_edit_delete_v1.sql).',
          );
        }
        throw error;
      }
    },
    onSuccess: () => {
      setEditing(false);
      setPreview(null);
      refresh();
    },
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
      // Best-effort tidy of the image so the bucket does not keep orphans.
      // Never fatal: the post is already gone by this point.
      if (imagePath) await supabase.storage.from('post-images').remove([imagePath]);
    },
    onSuccess: () => {
      setConfirming(false);
      refresh();
    },
  });

  async function replaceImage(file: File) {
    setErr(null);
    if (!file.type.startsWith('image/')) {
      setErr('Please choose an image file.');
      return;
    }
    setBusy(true);
    try {
      const me = await currentUserId();
      if (!me) throw new Error('Not signed in');
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not prepare the image');
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close?.();
      const blob = await new Promise<Blob | null>((r) =>
        canvas.toBlob(r, 'image/jpeg', 0.85),
      );
      if (!blob) throw new Error('Could not prepare the image');
      const path = `${me}/${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from('post-images')
        .upload(path, blob, { contentType: 'image/jpeg', upsert: false });
      if (error) throw error;
      setDraftImage(path);
      setPreview(URL.createObjectURL(blob));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not add the image.');
    } finally {
      setBusy(false);
    }
  }

  // Only the author sees these controls. RLS enforces it server-side too, so
  // this is about not showing a button that would fail.
  if (!meId || meId !== authorId) return null;

  const currentImageUrl = preview
    ? preview
    : draftImage
      ? supabase.storage.from('post-images').getPublicUrl(draftImage).data.publicUrl
      : null;

  return (
    <>
      <div className="relative shrink-0" ref={wrapRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Post options"
          className="grid h-8 w-8 place-items-center rounded-full bg-surface-2 text-muted transition-colors hover:bg-magenta/20 hover:text-magenta-text"
        >
          <IconMore />
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 z-30 mt-1 w-40 overflow-hidden rounded-xl border border-line bg-surface shadow-xl"
          >
            <button
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                setDraft(body);
                setDraftImage(imagePath);
                setPreview(null);
                setErr(null);
                setEditing(true);
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-body transition-colors hover:bg-surface-2 hover:text-heading"
            >
              <IconPencil className="h-4 w-4 shrink-0 text-magenta-text" />
              Edit post
            </button>
            <button
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                setConfirming(true);
              }}
              className="flex w-full items-center gap-2.5 border-t border-line px-3 py-2.5 text-left text-sm text-body transition-colors hover:bg-surface-2 hover:text-danger"
            >
              <IconTrash className="h-4 w-4 shrink-0 text-danger" />
              Delete post
            </button>
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-line bg-surface p-5 shadow-2xl">
            <h2 className="mb-3 font-serif text-lg text-heading">Edit post</h2>

            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-lg border border-line-strong p-3 text-sm outline-none focus:border-magenta"
            />

            {currentImageUrl && (
              <div className="relative mt-3 inline-block">
                <img
                  src={currentImageUrl}
                  alt=""
                  className="max-h-56 rounded-lg border border-line object-contain"
                />
                <button
                  onClick={() => {
                    setDraftImage(null);
                    setPreview(null);
                  }}
                  aria-label="Remove image"
                  className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-ground/80 text-sm text-heading hover:bg-ground"
                >
                  ×
                </button>
              </div>
            )}

            {err && <p className="mt-2 text-sm text-danger">{err}</p>}
            {save.isError && (
              <p className="mt-2 text-sm text-danger">{(save.error as Error).message}</p>
            )}

            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="rounded-lg border border-line px-3 py-2 text-sm text-muted transition-colors hover:border-magenta hover:text-magenta-text disabled:opacity-50"
              >
                {busy ? 'Adding…' : currentImageUrl ? 'Replace photo' : 'Add a photo'}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditing(false);
                    setPreview(null);
                  }}
                  className="rounded-lg border border-line px-4 py-2 text-sm text-body hover:text-heading"
                >
                  Cancel
                </button>
                <button
                  onClick={() => save.mutate()}
                  disabled={save.isPending || busy || (!draft.trim() && !draftImage)}
                  className="rounded-lg bg-magenta px-4 py-2 text-sm font-semibold text-white hover:bg-magenta-hi disabled:opacity-50"
                >
                  {save.isPending ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) void replaceImage(f);
              }}
            />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirming}
        title="Delete this post?"
        body="This removes the post and its comments for everyone. It cannot be undone."
        confirmLabel="Delete post"
        destructive
        busy={remove.isPending}
        onConfirm={() => remove.mutate()}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
