/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Laurie's Love — "Plume, refined" palette (Skyway Media, Aug 2026).
        // Source of truth: https://branding.skyway.media/ll/
        deepwater: '#0F474C', // the ground; owns most surfaces
        harbor: '#082729', // deepwater taken deeper, full-bleed fields
        lagoon: {
          DEFAULT: '#1789A8', // a glint — interface & links
          hi: '#22A6C7', // hover/active only
        },
        // Magenta leads the interface (client direction, Sept 2026 — this
        // overrides the guide's "one vivid stroke" note in favour of the
        // approved UI comp). Two stops, because one colour cannot do both jobs:
        //   DEFAULT #911766 is a FILL. White on it scores 8.34:1 — excellent.
        //   As TEXT on our dark card it scores 1.82:1, which is unreadable.
        //   text  #F45FAF is the on-dark stop: 5.14:1 on cards, passes WCAG AA.
        // The comp uses exactly this split — deep fills, bright pink type.
        magenta: {
          DEFAULT: '#911766', // fills: buttons, avatars, rules
          hi: '#B01D7D', // fill hover
          text: '#F45FAF', // type, icons and links on dark
          // Icon plates. A magenta alpha over the teal surface mixes to a
          // washed grey-purple, so this is a solid maroon instead — reads as
          // a deep magenta plate the way the comp does.
          plate: '#58163B',
        },
        gilt: '#C6A45E', // warm metal; used as a LINE only, never a fill
        seamist: '#EAF2F2', // the light — text, space, breathing room
        ink: '#051A1D', // deepest ground

        // ── Semantic layer (dark surfaces).
        // The guide fixes the palette but not the surface treatment; these are
        // the six colours above arranged for a dark UI. Components reference
        // these, never raw hexes, so a future light mode is a token swap.
        ground: '#051A1D', // page background — Ink, the deck's own ground
        surface: {
          DEFAULT: '#0A2A2D', // cards: Harbor lifted just off the ground
          2: '#0E383C', // inputs, chips, hover fills
        },
        // Borders are a faint white veil, not a teal line — the teal read as
        // hard edges against the dark ground. Alpha means they sit correctly
        // on both the ground and the slightly lighter card.
        line: {
          DEFAULT: 'rgb(255 255 255 / 0.08)', // card edges, hairlines
          strong: 'rgb(255 255 255 / 0.14)', // emphasised dividers
        },
        heading: '#EAF2F2', // Sea Mist — headings and primary text
        body: '#D3E3E4', // long-form copy, a step down from Sea Mist
        muted: '#8FA9AC', // secondary/meta text
        faint: '#6E8B8F', // timestamps, disabled, least-important

        // Status. Light-side reds/greens go muddy on a dark ground, so these
        // are lifted to stay legible against Ink.
        danger: { DEFAULT: '#E8686B', hi: '#F28184' },
        success: '#5FC98B',
        warn: '#E2B857',

        // Deepwater-led ramp. Repurposed from the old magenta scale so existing
        // bg-brand-*/text-brand-* classes shift to teal automatically.
        brand: {
          50: '#EAF2F2', // Sea Mist
          100: '#D6E6E7',
          200: '#A9CCCF',
          300: '#5AA9B5',
          400: '#1789A8', // Lagoon
          500: '#127C99',
          600: '#0F474C', // Deepwater
          700: '#0F474C', // Deepwater (primary)
          800: '#0B383C',
          900: '#082729', // Harbor
        },
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Figtree', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
