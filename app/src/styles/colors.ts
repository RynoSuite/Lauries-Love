import { MMKV } from 'react-native-mmkv';

// ───────────────────────────────────────────────────────────────────────────
// Light and dark, without converting 217 files.
//
// Every stylesheet in this app calls StyleSheet.create() at MODULE LOAD, which
// copies these values once and freezes them. The textbook fix — a theme
// context, styles built per render — means rewriting 133 stylesheets and 100
// components that use colours inline: a regression surface covering every
// screen in the app.
//
// So the palette is chosen at module load instead, from a preference read
// SYNCHRONOUSLY out of MMKV before any stylesheet evaluates. Flipping the mode
// writes the preference and reloads the app, which is why the toggle warns
// that it will. That is the honest cost: a reload rather than an instant
// repaint.
//
// It is also upgradeable. Screens can move to a live theme hook one at a time
// later, and when enough have, the reload can go. Nothing here blocks that.
// ───────────────────────────────────────────────────────────────────────────

export type ColorMode = 'dark' | 'light';

export const COLOR_MODE_KEY = 'll.color-mode';

// Created LAZILY and defensively, never at module scope.
//
// This file is imported by 217 others, including the first ones the app
// evaluates. `new MMKV()` at module scope means that if the native module is
// not ready at that instant — or throws for any reason — the failure happens
// before anything can render, and the app dies with "error loading app" and no
// usable stack. A colour palette must never be able to take the app down, so
// the store is built on first use and every failure falls back to dark.
let store: MMKV | null = null;
let storeFailed = false;

function getStore(): MMKV | null {
  if (store || storeFailed) return store;
  try {
    store = new MMKV();
  } catch {
    storeFailed = true;
  }
  return store;
}

/** The stored preference, or dark. Dark is the approved design's default. */
export function getColorMode(): ColorMode {
  try {
    return getStore()?.getString(COLOR_MODE_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function setStoredColorMode(mode: ColorMode) {
  try {
    getStore()?.set(COLOR_MODE_KEY, mode);
  } catch {
    // Nothing useful to do: the toggle simply will not persist, and the app
    // stays on the mode it is already showing.
  }
}

const shared = {
  white: '#FFFFFF',
  transparent: 'transparent',

  // Laurie's Love — "Plume, refined" brand palette (Skyway Media, Aug 2026).
  harbor: '#082729', // deepest fields
  lagoon: '#1789A8', // interface & links
  magenta: '#911766', // single accent stroke, never two
  gilt: '#C6A45E', // warm metal — line only, never a fill
  seaMist: '#EAF2F2', // light / breathing room
  ink: '#051A1D',

  cararra: '#EEEDE7',
  cararra50: '#EEEDE780',
  quaternary20070: '#EEEDE7B2',
  quaternary10018: '#B25D952E',
  quaternary20018: '#FFA23C2E',

  cinnabar: '#EA483D',

  peachOrange: '#FFD19D',

  gableGreen: '#153232',

  blueChalk: '#F1E3FF',
  blueChalk50: '#F1E3FF80',

  silver: '#BFBFBF',
  silverChalice: '#A6A6A6',

  disco: '#911766',
  wineBerry: '#3D112D',

  black: '#000000',
  black14: '#00000014',

  // Primary is now Deepwater teal (was magenta). Magenta drops to a single
  // accent — see `magenta` / `disco` above.
  primary: {
    100: '#E3EFF0',
    200: '#B9D7DB',
    300: '#6FA9B2',
    400: '#1789A8', // Lagoon — interface & links
    500: '#0F474C', // Deepwater — the lead colour
    600: '#082729', // Harbor — deepest fields
  },

  secondary: {
    100: '#F6F1FB',
    200: '#F1E3FF',
    300: '#E3C6FF',
    400: '#BE9BF2',
    500: '#A56EDC',
    600: '#8134CE',
  },

  tertiary: {
    100: '#FFF7EB',
    200: '#FFE3C3',
    300: '#FFD19D',
    400: '#FFBD76',
    500: '#FFA23C',
  },

  quaternary: {
    100: '#F9F9F8',
    200: '#EEEDE7',
    300: '#D8D8CF',
    400: '#C7C7BB',
  },

  neutral: {
    100: '#FFFFFF',
    200: '#F6F5F5',
    300: '#EBEAEA',
    400: '#E0E0E0',
    500: '#BFBFBF',
    600: '#A6A6A6',
    700: '#737373',
    800: '#4D4D4D',
    900: '#262626',
    1000: '#000000',
  },

  error: {
    100: '#FDEDEC',
    200: '#F9C8C5',
    300: '#F2918B',
    400: '#EA483D',
    500: '#BB3A31',
  },

  warning: {
    100: '#FEF9ED',
    200: '#FCEEC8',
    300: '#FADD91',
    400: '#F6C648',
    500: '#C9A23A',
  },

  success: {
    100: '#F4FCEE',
    200: '#DEF7CB',
    300: '#BDF097',
    400: '#91E652',
    500: '#75BB42',
  },

  // ---------------------------------------------------------------------
  // Semantic tokens, matching the web app exactly (web/src/index.css).
  //
  // The brand colours above already agreed with the web; what did not was the
  // surfaces. The app is built on white cards and peach gradients while the
  // approved design is a dark, magenta-led ground. These are the names the web
  // uses, so a screen converted to them is converted for good — the next
  // palette change happens in one place rather than across 70 stylesheets.
  //
  // Use these for anything structural. Reach for the raw brand names above
  // only where the design genuinely calls for that specific pigment.
  magentaHi: '#B01D7D', // pressed / hover fill — a FILL, so it does not flip
};

// ── The tokens that depend on the ground being dark ────────────────────────
//
// Same names and same values as the web app, so a colour decided once holds on
// both. Only what genuinely changes with the lights is here; the brand fills,
// gold and the numeric scales above stay put.
const darkTokens = {
  ground: '#051A1D', // page behind everything
  surface: '#0A2A2D', // cards, sheets, bars
  surface2: '#0E383C', // raised: inputs, chips, pressed states
  line: '#1E3B3E', // hairlines
  lineStrong: '#2C4244', // borders that must be seen
  heading: '#EAF2F2', // titles
  body: '#D3E3E4', // paragraphs
  muted: '#8FA9AC', // secondary text
  faint: '#6E8B8F', // timestamps, captions
  magentaText: '#F45FAF', // magenta AS TYPE on dark — 5.14:1, passes AA
  magentaPlate: '#58163B', // icon discs
  danger: '#E8686B',
  dangerHi: '#F28184',
  warn: '#E2B857',
  successText: '#5FC98B',
  // Structural despite the brand name: every one of its 25 uses is a gradient
  // stop, the map's geometry fill, or a glass overlay. None is an accent on a
  // card, so it has to lighten with everything else or the gradients would run
  // from a white page into a dark teal.
  deepwater: '#0F474C',
};

const lightTokens: typeof darkTokens = {
  ground: '#F4F7F7',
  surface: '#FFFFFF',
  surface2: '#EAF0F1',
  line: '#D8E2E3',
  lineStrong: '#C2D2D3',
  heading: '#0A2A2D', // 15.2:1 on the card
  body: '#123239', // 13.6:1
  muted: '#4F6A6E', // 5.8:1
  faint: '#546E71', // 5.5:1 — the dark side's faint only manages 3.5 on its own input surface
  // #F45FAF exists because #911766 scores 1.82:1 on the dark card. On white
  // that inverts exactly, so the fill itself becomes the readable stop: 8.34:1.
  magentaText: '#911766',
  magentaPlate: '#F4D7EA', // a tint, still 6.3:1 against the text stop above
  // The dark theme lightened these to survive a dark ground; on white the same
  // values are washed out, so they come back down.
  danger: '#B3262B',
  dangerHi: '#8E1B20',
  warn: '#8A6100',
  successText: '#1B7A47',
  deepwater: '#DCE9EA',
};

const colors = {
  ...shared,
  ...(getColorMode() === 'light' ? lightTokens : darkTokens),
};

export default colors;
