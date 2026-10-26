/**
 * src/theme.ts — Backward-compatible re-export module.
 *
 * All theme definitions have been moved into src/theme/:
 *   - palettes.ts  → darkPalette, lightPalette, ColorPalette, Scheme, ThemePreference
 *   - tokens.ts    → spacing, radius, fonts, splash
 *   - withAlpha.ts → withAlpha()
 *   - makeStyles.ts → makeStyles(), useThemedStyles()
 *   - ThemeContext.tsx → ThemeProvider, useTheme(), usePrefs()
 *
 * Import from 'src/theme' or 'src/theme/index' — both resolve to the same exports.
 *
 * Legacy `colors` alias for dark palette is kept here for backward compatibility.
 */
export * from './theme/index';

// Legacy alias — `colors` maps to the dark palette tokens.
// Prefer importing `darkPalette` directly from 'src/theme/palettes'.
export { darkPalette as colors } from './theme/palettes';
