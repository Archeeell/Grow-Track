import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Appearance,
  Platform,
  useColorScheme as useRNColorScheme,
} from 'react-native';
import {
  DEFAULT_PREFS,
  loadPrefs,
  savePrefs,
  type Prefs,
  type Theme,
} from '../settings/prefsStorage';
import { darkPalette, lightPalette, type ColorPalette, type Scheme } from './palettes';

export type ThemeContextType = {
  colors: ColorPalette;
  scheme: Scheme;
  preference: Theme;
  setPreference: (theme: Theme) => Promise<void>;
  prefs: Prefs;
  updatePrefs: (patch: Partial<Prefs>) => Promise<void>;
  resetPrefs: () => Promise<void>;
  isReady: boolean;
};

const defaultThemeValue: ThemeContextType = {
  colors: darkPalette,
  scheme: 'dark',
  preference: 'dark',
  setPreference: async () => {},
  prefs: DEFAULT_PREFS,
  updatePrefs: async () => {},
  resetPrefs: async () => {},
  isReady: true,
};

export const ThemeContext = createContext<ThemeContextType>(defaultThemeValue);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefsState] = useState<Prefs>(DEFAULT_PREFS);
  const [isReady, setIsReady] = useState(false);
  const isLoadedRef = useRef(false);

  // Load preferences once on mount
  useEffect(() => {
    let mounted = true;
    loadPrefs().then((loaded) => {
      if (mounted) {
        setPrefsState(loaded);
        isLoadedRef.current = true;
        setIsReady(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // System color scheme tracking (RN hook tracks live OS changes & web matchMedia)
  const systemScheme = useRNColorScheme();

  // Resolved scheme:
  // - If user chose 'light', scheme is 'light'
  // - If user chose 'dark', scheme is 'dark'
  // - If user chose 'system', follows OS scheme (defaults to 'dark' if unspecified)
  const scheme: Scheme = useMemo(() => {
    if (prefs.theme === 'light') return 'light';
    if (prefs.theme === 'dark') return 'dark';
    return systemScheme === 'light' ? 'light' : 'dark';
  }, [prefs.theme, systemScheme]);

  const colors: ColorPalette = useMemo(() => {
    return scheme === 'light' ? lightPalette : darkPalette;
  }, [scheme]);

  // Sync Appearance.setColorScheme on native so alert / keyboard / picker follow
  useEffect(() => {
    try {
      if (prefs.theme === 'system') {
        Appearance.setColorScheme(null as any);
      } else {
        Appearance.setColorScheme(prefs.theme);
      }
    } catch {
      // Ignore platforms where Appearance.setColorScheme is unsupported
    }
  }, [prefs.theme]);

  // Web sync: documentElement class, color-scheme, and body background
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      try {
        if (scheme === 'light') {
          document.documentElement.classList.add('light');
        } else {
          document.documentElement.classList.remove('light');
        }
        document.documentElement.style.colorScheme = scheme;
        if (document.body) {
          document.body.style.backgroundColor = colors.bg;
        }
      } catch {
        // Ignore on SSR / non-DOM environments
      }
    }
  }, [scheme, colors.bg]);

  // Set theme preference specifically
  const setPreference = useCallback(async (newTheme: Theme) => {
    setPrefsState((current) => {
      const next = { ...current, theme: newTheme };
      if (isLoadedRef.current) {
        savePrefs(next).catch(() => {});
      }
      return next;
    });
  }, []);

  // Update general preferences
  const updatePrefs = useCallback(async (patch: Partial<Prefs>) => {
    setPrefsState((current) => {
      const next = { ...current, ...patch };
      if (isLoadedRef.current) {
        savePrefs(next).catch(() => {});
      }
      return next;
    });
  }, []);

  // Reset preferences matching Figma Make reset behavior
  const resetPrefs = useCallback(async () => {
    const next: Prefs = {
      theme: 'dark',
      notifications: true,
      time: '24',
      behavior: 'seed',
    };
    setPrefsState(next);
    if (isLoadedRef.current) {
      await savePrefs(next);
    }
  }, []);

  const value = useMemo(
    () => ({
      colors,
      scheme,
      preference: prefs.theme,
      setPreference,
      prefs,
      updatePrefs,
      resetPrefs,
      isReady,
    }),
    [colors, scheme, prefs, setPreference, updatePrefs, resetPrefs, isReady],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Hook to access current theme tokens, resolved scheme, and preferences.
 * Safe to use without a Provider (falls back to darkPalette).
 */
export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  return ctx || defaultThemeValue;
}

/**
 * Convenience hook for accessing preferences and updates.
 */
export function usePrefs() {
  const { prefs, updatePrefs, resetPrefs, isReady } = useTheme();
  return { prefs, updatePrefs, resetPrefs, isReady };
}
