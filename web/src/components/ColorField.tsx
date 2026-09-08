import { useEffect, useRef, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { isValidHex } from '../lib/theme';

// A colour input that opens a real picker — saturation square, hue slider, hex
// field — instead of the browser's native <input type="color">, which hands
// off to the operating system's colour dialog and looks nothing like the app.
//
// Typing is kept separate from committing: the hex box holds whatever is being
// typed (including half-finished values) and only pushes upward once it parses,
// so the preview never flickers through nonsense mid-keystroke.
export function ColorField({
  label,
  hint,
  value,
  defaultValue,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  defaultValue: string;
  onChange: (hex: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => setDraft(value), [value]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function commitDraft(next: string) {
    setDraft(next);
    const withHash = next.startsWith('#') ? next : `#${next}`;
    if (isValidHex(withHash)) onChange(withHash.toUpperCase());
  }

  const isDefault = value.toUpperCase() === defaultValue.toUpperCase();

  return (
    <div className="relative flex items-start gap-3 py-2.5" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Change ${label}`}
        className="mt-0.5 h-9 w-9 shrink-0 rounded-lg border border-line transition-transform hover:scale-105"
        style={{ background: isValidHex(value) ? value : defaultValue }}
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2">
          <span className="text-sm font-medium text-heading">{label}</span>
          {!isDefault && (
            <button
              type="button"
              onClick={() => onChange(defaultValue)}
              className="text-xs text-magenta-text hover:underline"
            >
              reset
            </button>
          )}
        </div>
        {hint && <p className="mt-0.5 text-xs leading-relaxed text-faint">{hint}</p>}
      </div>

      <input
        value={draft}
        onChange={(e) => commitDraft(e.target.value)}
        spellCheck={false}
        aria-label={`${label} hex value`}
        className="mt-0.5 w-24 shrink-0 rounded-lg border border-line px-2 py-1.5 font-mono text-xs uppercase outline-none focus:border-magenta"
      />

      {open && (
        <div className="absolute left-0 top-12 z-30 rounded-xl border border-line bg-surface p-3 shadow-xl">
          <HexColorPicker color={isValidHex(value) ? value : defaultValue} onChange={onChange} />
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-muted">{value}</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md bg-magenta px-2.5 py-1 text-xs font-semibold text-white hover:bg-magenta-hi"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
