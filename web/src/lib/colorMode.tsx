import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { ColorMode } from './theme';

// Light / dark mode, chosen by the member from the account menu.
//
// Two things carry the choice, and they have to agree:
//   · `data-theme` on <html>, which index.css keys its light token block off,
//     and which the inline script in index.html sets before the first paint so
//     a light-mode member never sees a dark flash.
//   · applyTheme(), which writes the same values as inline styles once React
//     mounts, because an org's saved branding is inline too. See theme.ts.
//
// The choice is a per-device display preference, so it lives in localStorage
// rather than the profiles table: no round trip, no migration, and it is
// already correct on the next load before anything is fetched.

export const COLOR_MODE_KEY = 'll.color-mode';

type ColorModeValue = {
  mode: ColorMode;
  setMode: (mode: ColorMode) => void;
  toggle: () => void;
};

const ColorModeContext = createContext<ColorModeValue>({
  mode: 'dark',
  setMode: () => {},
  toggle: () => {},
});

export const useColorMode = () => useContext(ColorModeContext);

/**
 * The stored choice, or dark.
 *
 * Dark is the default on purpose: the approved comp is the dark theme, and
 * following the operating system instead would hand a member a look the client
 * never signed off on, on their first visit, without their asking.
 */
export function readStoredMode(): ColorMode {
  try {
    return localStorage.getItem(COLOR_MODE_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    // Safari in private mode throws on localStorage rather than returning null.
    return 'dark';
  }
}

export function ColorModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ColorMode>(readStoredMode);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = mode;
    // Native controls — scrollbars, date pickers, checkboxes — read this, and
    // they are the parts the palette cannot reach.
    root.style.colorScheme = mode;
    // The browser chrome on mobile, which otherwise stays the dark teal.
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', mode === 'light' ? '#FFFFFF' : '#0F474C');
    try {
      localStorage.setItem(COLOR_MODE_KEY, mode);
    } catch {
      // A member with storage blocked still gets the mode for this visit.
    }
  }, [mode]);

  const setMode = useCallback((next: ColorMode) => setModeState(next), []);
  const toggle = useCallback(
    () => setModeState((m) => (m === 'light' ? 'dark' : 'light')),
    [],
  );

  return (
    <ColorModeContext.Provider value={{ mode, setMode, toggle }}>
      {children}
    </ColorModeContext.Provider>
  );
}
