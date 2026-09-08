// The app's colour tokens, in one place.
//
// index.css declares the defaults as CSS variables and tailwind.config.js
// resolves every colour utility through them. This file is the *description*
// of that set: what each token is called, what it does, and what it defaults
// to — so the admin console can render an editor without hardcoding a list
// that drifts from the CSS.
//
// Adding a colour: add the --c-<key> default to index.css, reference it in
// tailwind.config.js, and add an entry here. No migration needed — overrides
// are stored as JSON.

export type ThemeToken = {
  key: string;
  label: string;
  hint: string;
  default: string;
};

export type ThemeGroup = {
  title: string;
  blurb: string;
  tokens: ThemeToken[];
};

export const THEME_GROUPS: ThemeGroup[] = [
  {
    title: 'Brand',
    blurb:
      'The colours people recognise. Magenta leads the interface — buttons, links, active tabs.',
    tokens: [
      {
        key: 'magenta',
        label: 'Brand fill',
        hint: 'Buttons, avatars, the rule under page titles. White text sits on this.',
        default: '#911766',
      },
      {
        key: 'magenta-hi',
        label: 'Brand fill — hover',
        hint: 'The brand fill when a button is hovered. Usually a touch lighter.',
        default: '#B01D7D',
      },
      {
        key: 'magenta-text',
        label: 'Brand text',
        hint: 'Links, module titles, active nav. Must be light enough to read on the dark card.',
        default: '#F45FAF',
      },
      {
        key: 'magenta-plate',
        label: 'Icon plate',
        hint: 'The disc behind sidebar icons.',
        default: '#58163B',
      },
      {
        key: 'gilt',
        label: 'Gold',
        hint: 'The metal accent. Used as a line, never a fill.',
        default: '#C6A45E',
      },
    ],
  },
  {
    title: 'Surfaces',
    blurb: 'The page itself — what everything else sits on.',
    tokens: [
      { key: 'ground', label: 'Page background', hint: 'Behind everything.', default: '#051A1D' },
      { key: 'surface', label: 'Card background', hint: 'Posts, panels, the sidebar cards.', default: '#0A2A2D' },
      {
        key: 'surface-2',
        label: 'Input background',
        hint: 'Text fields, chips, hover fills. Slightly lighter than a card.',
        default: '#0E383C',
      },
      { key: 'line', label: 'Borders', hint: 'Card edges and dividers.', default: '#1E3B3E' },
      { key: 'line-strong', label: 'Borders — strong', hint: 'Emphasised dividers.', default: '#2C4244' },
      { key: 'harbor', label: 'Header background', hint: 'The top navigation bar.', default: '#082729' },
    ],
  },
  {
    title: 'Text',
    blurb: 'Four steps, brightest to faintest.',
    tokens: [
      { key: 'heading', label: 'Headings', hint: 'Page and card titles.', default: '#EAF2F2' },
      { key: 'body', label: 'Body text', hint: 'Post content and paragraphs.', default: '#D3E3E4' },
      { key: 'muted', label: 'Secondary text', hint: 'Descriptions and helper copy.', default: '#8FA9AC' },
      { key: 'faint', label: 'Faint text', hint: 'Timestamps and disabled states.', default: '#6E8B8F' },
    ],
  },
  {
    title: 'Status',
    blurb: 'Errors, confirmations and warnings.',
    tokens: [
      { key: 'danger', label: 'Error', hint: 'Error messages and destructive buttons.', default: '#E8686B' },
      { key: 'danger-hi', label: 'Error — hover', hint: '', default: '#F28184' },
      { key: 'success', label: 'Success', hint: 'Confirmations.', default: '#5FC98B' },
      { key: 'warn', label: 'Warning', hint: 'Cautions.', default: '#E2B857' },
    ],
  },
  {
    title: 'Secondary',
    blurb: 'Kept from the original palette. Rarely needs changing.',
    tokens: [
      { key: 'lagoon', label: 'Teal', hint: 'Secondary accent.', default: '#1789A8' },
      { key: 'lagoon-hi', label: 'Teal — hover', hint: '', default: '#22A6C7' },
      { key: 'deepwater', label: 'Deepwater', hint: 'Original brand teal.', default: '#0F474C' },
      { key: 'seamist', label: 'Sea mist', hint: 'The brand light.', default: '#EAF2F2' },
      { key: 'ink', label: 'Ink', hint: 'The deepest ground.', default: '#051A1D' },
    ],
  },
];

export const ALL_TOKENS: ThemeToken[] = THEME_GROUPS.flatMap((g) => g.tokens);

export const DEFAULT_THEME: Record<string, string> = Object.fromEntries(
  ALL_TOKENS.map((t) => [t.key, t.default]),
);

/** "#911766" -> "145 23 102". Tailwind needs channels, not hex, for alpha. */
export function hexToChannels(hex: string): string | null {
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

export function isValidHex(hex: string): boolean {
  return hexToChannels(hex) !== null;
}

/**
 * Writes a theme onto the document. Unknown keys are ignored and invalid hex
 * is skipped rather than clearing the variable, so a malformed value in the
 * database degrades to the compiled default instead of an unstyled page.
 */
export function applyTheme(theme: Record<string, string> | null | undefined) {
  const root = document.documentElement;
  for (const token of ALL_TOKENS) {
    const value = theme?.[token.key];
    if (!value) {
      root.style.removeProperty(`--c-${token.key}`);
      continue;
    }
    const channels = hexToChannels(value);
    if (channels) root.style.setProperty(`--c-${token.key}`, channels);
  }
}

/** Relative luminance contrast, for warning when text would be unreadable. */
export function contrastRatio(a: string, b: string): number | null {
  const lum = (hex: string) => {
    const ch = hexToChannels(hex);
    if (!ch) return null;
    const [r, g, bl] = ch.split(' ').map((v) => {
      const s = Number(v) / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const la = lum(a);
  const lb = lum(b);
  if (la === null || lb === null) return null;
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
