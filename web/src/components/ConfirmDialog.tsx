import { useEffect, useRef } from 'react';

// A confirm dialog that belongs to the app rather than the browser.
//
// window.confirm() renders unstyled OS chrome, cannot be branded, and on some
// browsers is suppressed entirely — so a destructive action could silently do
// nothing. This is a real modal: focus moves into it, Escape and the backdrop
// close it, and the confirm button is styled by intent so "Delete" never looks
// like "Cancel".
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    // Focus lands on Cancel-adjacent rather than the destructive button, so a
    // stray Enter does not delete something.
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-sm rounded-2xl border border-line bg-surface p-5 shadow-2xl"
      >
        <h2 id="confirm-title" className="font-serif text-lg text-heading">
          {title}
        </h2>
        {body && <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-line px-4 py-2 text-sm text-body transition-colors hover:text-heading disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            disabled={busy}
            className={
              'rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50 ' +
              (destructive
                ? 'bg-danger hover:bg-danger-hi'
                : 'bg-magenta hover:bg-magenta-hi')
            }
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
