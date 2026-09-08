/** @type {import('tailwindcss').Config} */

// Every colour below resolves through a CSS custom property so the admin
// console can repaint the whole app at runtime (branding_settings.theme).
//
// The variables hold SPACE-SEPARATED RGB CHANNELS ("145 23 102"), not hex,
// because that is the only form that keeps Tailwind's alpha modifiers working
// — bg-magenta/15, border-line/40 and so on. Defaults live in index.css; this
// file only points at them, so a missing variable falls back to the value
// compiled there rather than to nothing.
const c = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── "Plume, refined" palette (Skyway Media, Aug 2026).
        // Source of truth: https://branding.skyway.media/ll/
        deepwater: c('deepwater'),
        harbor: c('harbor'),
        gilt: c('gilt'),
        seamist: c('seamist'),
        ink: c('ink'),

        lagoon: {
          DEFAULT: c('lagoon'),
          hi: c('lagoon-hi'),
        },

        // Magenta leads the interface (client direction, Sept 2026 — this
        // overrides the guide's "one vivid stroke" note in favour of the
        // approved UI comp). Three stops, because one colour cannot do every
        // job: DEFAULT is a FILL (white on it scores 8.34:1); as TYPE on the
        // dark card it scores 1.82:1, unreadable, so `text` is the on-dark
        // stop at 5.14:1; `plate` is the icon disc, a solid maroon because a
        // magenta alpha over the teal surface mixes to a washed grey-purple.
        magenta: {
          DEFAULT: c('magenta'),
          hi: c('magenta-hi'),
          text: c('magenta-text'),
          plate: c('magenta-plate'),
        },

        // ── Semantic layer (dark surfaces).
        ground: c('ground'),
        surface: {
          DEFAULT: c('surface'),
          2: c('surface-2'),
        },
        line: {
          DEFAULT: c('line'),
          strong: c('line-strong'),
        },
        heading: c('heading'),
        body: c('body'),
        muted: c('muted'),
        faint: c('faint'),

        // Status. Light-side reds/greens go muddy on a dark ground, so these
        // are lifted to stay legible against Ink.
        danger: {
          DEFAULT: c('danger'),
          hi: c('danger-hi'),
        },
        success: c('success'),
        warn: c('warn'),

        // Legacy ramp, kept so any stray bg-brand-*/text-brand-* still resolves.
        brand: {
          50: '#EAF2F2',
          100: '#D6E6E7',
          200: '#A9CCCF',
          300: '#5AA9B5',
          400: '#1789A8',
          500: '#127C99',
          600: '#0F474C',
          700: '#0F474C',
          800: '#0B383C',
          900: '#082729',
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
