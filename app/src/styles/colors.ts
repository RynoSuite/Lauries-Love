const colors = {
  white: '#FFFFFF',
  transparent: 'transparent',

  // Laurie's Love — "Plume, refined" brand palette (Skyway Media, Aug 2026).
  deepwater: '#0F474C', // primary ground — owns most surfaces
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
  ground: '#051A1D', // page behind everything
  surface: '#0A2A2D', // cards, sheets, bars
  surface2: '#0E383C', // raised: inputs, chips, pressed states
  line: '#1E3B3E', // hairlines
  lineStrong: '#2C4244', // borders that must be seen
  heading: '#EAF2F2', // titles
  body: '#D3E3E4', // paragraphs
  muted: '#8FA9AC', // secondary text
  faint: '#6E8B8F', // timestamps, captions
  magentaHi: '#B01D7D', // pressed / hover fill
  magentaText: '#F45FAF', // magenta AS TYPE on dark — 5.14:1, passes AA
  magentaPlate: '#58163B', // icon discs
  danger: '#E8686B',
  dangerHi: '#F28184',
  warn: '#E2B857',
  successText: '#5FC98B',
};

export default colors;
