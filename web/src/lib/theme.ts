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
      'The colors people recognize. Magenta leads the interface, buttons, links, active tabs.',
    tokens: [
      {
        key: 'magenta',
        label: 'Brand fill',
        hint: 'Buttons, avatars, the rule under page titles. White text sits on this.',
        default: '#911766',
      },
      {
        key: 'magenta-hi',
        label: 'Brand fill, hover',
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
    blurb: 'The page itself, what everything else sits on.',
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
      { key: 'line-strong', label: 'Borders, strong', hint: 'Emphasised dividers.', default: '#2C4244' },
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
      { key: 'danger-hi', label: 'Error, hover', hint: '', default: '#F28184' },
      { key: 'success', label: 'Success', hint: 'Confirmations.', default: '#5FC98B' },
      { key: 'warn', label: 'Warning', hint: 'Cautions.', default: '#E2B857' },
    ],
  },
  {
    title: 'Secondary',
    blurb: 'Kept from the original palette. Rarely needs changing.',
    tokens: [
      { key: 'lagoon', label: 'Teal', hint: 'Secondary accent.', default: '#1789A8' },
      { key: 'lagoon-hi', label: 'Teal, hover', hint: '', default: '#22A6C7' },
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

// ── Light mode ─────────────────────────────────────────────────────────────
//
// Only the tokens that DEPEND on the ground being dark are listed. Surfaces,
// the four text steps and the status colours all flip; the brand fill, gold
// and teal do not, because they are the brand and it does not change with the
// lights.
//
// These values are duplicated in index.css under `:root[data-theme='light']`,
// which is what paints the first frame before React has mounted. This copy is
// what `applyTheme` writes as inline styles, because an org's saved theme is
// also written inline and would otherwise win over the stylesheet — see the
// note in applyTheme.
//
// Every text step clears 4.5:1 on the white card and on the page ground:
// heading 15.2, body 13.6, muted 5.8, faint 5.5.
export const LIGHT_TOKENS: Record<string, string> = {
  ground: '#F4F7F7',
  surface: '#FFFFFF',
  'surface-2': '#EAF0F1',
  line: '#D8E2E3',
  'line-strong': '#C2D2D3',
  // The header. White against the near-white ground, separated by its rule.
  harbor: '#FFFFFF',

  heading: '#0A2A2D',
  body: '#123239',
  muted: '#4F6A6E',
  faint: '#546E71',

  // The dark theme's reds and greens were lightened to survive a dark ground;
  // on white the same values are washed out, so they come back down.
  danger: '#B3262B',
  'danger-hi': '#8E1B20',
  success: '#1B7A47',
  warn: '#8A6100',

  // Teal is an accent that also has to be readable as a link.
  lagoon: '#0F6E88',
  'lagoon-hi': '#0B5A70',
};

/** The light theme's card, which brand type has to be readable against. */
const LIGHT_CARD = '#FFFFFF';

/**
 * The two brand tokens that are defined by the ground they sit on, recomputed
 * for the light theme.
 *
 * `magenta-text` exists because #911766 scores 1.82:1 on the dark card, so the
 * dark theme lightens it to #F45FAF. On white that inverts exactly — #F45FAF
 * scores 2.3:1 — so here the stop is DARKENED until it clears 4.5:1 instead.
 * The fill itself already passes at 8.34:1 and is usually the answer.
 *
 * `magenta-plate` is the disc behind sidebar icons: a dark maroon on the dark
 * theme, a pale tint of the same hue here, with the icon drawn in the text
 * stop over it (6.8:1 at the defaults).
 */
export function lightBrandTokens(fillHex: string): Record<string, string> {
  const hsl = hexToHsl(fillHex);
  if (!hsl) return {};
  const [h, s, l] = hsl;

  let text = fillHex.toUpperCase();
  for (let i = 0; i < 24; i++) {
    const ratio = contrastRatio(text, LIGHT_CARD);
    if (ratio !== null && ratio >= 4.5) break;
    // Walk down in lightness rather than trusting a fixed offset, so a pale or
    // desaturated brand colour still lands somewhere readable.
    text = hslToHex(h, Math.min(1, s * 1.05), Math.max(0.12, l - (i + 1) * 0.04));
  }

  return {
    'magenta-text': text,
    // A tint, not a wash: pale enough to sit on a white card, saturated enough
    // to still read as a disc rather than as nothing.
    'magenta-plate': hslToHex(h, Math.min(1, s * 0.8), 0.9),
  };
}

/** The full light-mode token set, including the brand stops derived from
 *  whatever fill the org has saved. */
export function lightThemeFor(theme: Record<string, string> | null | undefined) {
  const fill = theme?.magenta || DEFAULT_THEME.magenta;
  return { ...LIGHT_TOKENS, ...lightBrandTokens(fill) };
}

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

export type ColorMode = 'dark' | 'light';

/**
 * Writes a theme onto the document. Unknown keys are ignored and invalid hex
 * is skipped rather than clearing the variable, so a malformed value in the
 * database degrades to the compiled default instead of an unstyled page.
 *
 * In light mode the light value WINS over the org's saved one for the tokens
 * that flip. That is deliberate: every colour in the branding console was
 * picked against the dark ground, so honouring a saved #0A2A2D "card" here
 * would paint black cards on a white page. The brand fill, gold and the rest
 * of the palette still come from the org's theme — those are the brand.
 *
 * It also has to be written INLINE rather than left to the `[data-theme]`
 * rules in index.css: a saved theme is itself inline, and an inline value beats
 * any stylesheet rule no matter how specific.
 */
export function applyTheme(
  theme: Record<string, string> | null | undefined,
  mode: ColorMode = 'dark',
) {
  const root = document.documentElement;
  const light = mode === 'light' ? lightThemeFor(theme) : null;
  for (const token of ALL_TOKENS) {
    const value = light?.[token.key] ?? theme?.[token.key];
    if (!value) {
      root.style.removeProperty(`--c-${token.key}`);
      continue;
    }
    const channels = hexToChannels(value);
    if (channels) root.style.setProperty(`--c-${token.key}`, channels);
  }
}

// ── Brand family derivation ────────────────────────────────────────────────
//
// The brand is four tokens: the fill, its hover, the on-dark text stop, and
// the icon plate. Expecting anyone to set those independently — and to know
// that "module titles" means `magenta-text` rather than `magenta` — is a bad
// deal. Picking ONE brand colour derives the other three, and each can still
// be overridden by hand afterwards.

function hexToHsl(hex: string): [number, number, number] | null {
  const ch = hexToChannels(hex);
  if (!ch) return null;
  const [r, g, b] = ch.split(' ').map((v) => Number(v) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  [h, s, l] = [((h % 1) + 1) % 1, clamp(s), clamp(l)];
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    const v = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(v * 255);
  };
  return (
    '#' + [f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()
  );
}

/** The dark card these colours sit on; used to check the text stop is legible. */
const CARD_FOR_CONTRAST = '#0A2A2D';

/**
 * Given one brand colour, produce the whole family:
 *   fill  — as chosen
 *   hover — a little lighter
 *   text  — lightened until it clears 4.5:1 on the card, so links and titles
 *           stay readable no matter how dark a colour someone picks
 *   plate — pulled down dark for the icon discs
 */
export function deriveBrandFamily(baseHex: string): Record<string, string> {
  const hsl = hexToHsl(baseHex);
  if (!hsl) return {};
  const [h, s, l] = hsl;

  let text = hslToHex(h, Math.min(1, s * 0.92), Math.max(l, 0.55));
  // Walk it lighter until it is actually readable, rather than trusting a
  // fixed offset that fails for very dark or very desaturated picks.
  for (let i = 0; i < 20; i++) {
    const ratio = contrastRatio(text, CARD_FOR_CONTRAST);
    if (ratio !== null && ratio >= 4.5) break;
    text = hslToHex(h, Math.min(1, s * 0.92), Math.min(0.92, 0.55 + i * 0.02 + 0.02));
  }

  return {
    magenta: baseHex.toUpperCase(),
    'magenta-hi': hslToHex(h, s, Math.min(0.72, l + 0.08)),
    'magenta-text': text,
    'magenta-plate': hslToHex(h, Math.min(1, s * 0.85), Math.max(0.1, l * 0.62)),
  };
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
