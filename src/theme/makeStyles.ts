import { useMemo } from 'react';
import { StyleSheet, type ViewStyle, type TextStyle, type ImageStyle } from 'react-native';
import { useTheme } from './ThemeContext';
import { darkPalette, lightPalette, type ColorPalette, type Scheme } from './palettes';

export type ThemeProps = {
  colors: ColorPalette;
  scheme: Scheme;
};

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

/**
 * Creates a custom hook that returns memoized styles per color scheme.
 * The StyleSheet for each scheme (dark / light) is compiled exactly once.
 */
export function makeStyles<T extends NamedStyles<T> | NamedStyles<any>>(
  factory: (theme: ThemeProps) => T,
) {
  let darkCache: T | null = null;
  let lightCache: T | null = null;

  return function useThemedStylesHook(): T {
    const { scheme } = useTheme();
    if (scheme === 'dark') {
      if (!darkCache) {
        darkCache = StyleSheet.create(factory({ colors: darkPalette, scheme: 'dark' }));
      }
      return darkCache;
    } else {
      if (!lightCache) {
        lightCache = StyleSheet.create(factory({ colors: lightPalette, scheme: 'light' }));
      }
      return lightCache;
    }
  };
}

/**
 * Inline hook for dynamic themed styles.
 */
export function useThemedStyles<T extends NamedStyles<T> | NamedStyles<any>>(
  factory: (theme: ThemeProps) => T,
): T {
  const { colors, scheme } = useTheme();
  return useMemo(() => StyleSheet.create(factory({ colors, scheme })), [colors, scheme, factory]);
}
