export type ColorPalette = {
  bg: string;
  foreground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  accentBlue: string;
  card: string;
  border: string;
  muted: string;
  mutedForeground: string;
  surface: string;
  popover: string;
  growing: string;
  destruct: string;

  // Legacy aliases
  surfaceRaised: string;
  text: string;
  accent: string;
  accentDim: string;
  readyBg: string;
  danger: string;
  dangerBg: string;
  input: string;
  warningBg: string;
  warningText: string;
};

export type Scheme = 'dark' | 'light';
export type ThemePreference = 'dark' | 'light' | 'system';

/**
 * Dark Palette — byte-for-byte identical to the original `colors` export in `src/theme.ts`.
 * Source: Figma Make `:root` CSS variables.
 */
export const darkPalette: ColorPalette = {
  // Figma design system — exact values from CSS :root
  bg: '#0d1715',
  foreground: '#edf4ef',
  primary: '#45d483',
  primaryForeground: '#0d1715',
  secondary: '#243631',
  accentBlue: '#4ca8ff',
  card: '#14211e',
  border: '#2a3c35',
  muted: '#1c2b27',
  mutedForeground: '#91a69d',
  surface: '#1c2b27',
  popover: '#1c2b27',
  growing: '#e6c16a',
  destruct: '#e96a6a',

  // Legacy aliases
  surfaceRaised: '#1c2b27',
  text: '#edf4ef',
  accent: '#45d483',
  accentDim: '#1a4a30',
  readyBg: '#0f2c1c',
  danger: '#e96a6a',
  dangerBg: '#2a1515',
  input: '#1c2b27',
  warningBg: '#2a2210',
  warningText: '#e6c16a',
};

/**
 * Light Palette — exact values from Figma Make `.light` CSS variables and source code.
 * Source: `make_index.css` (.light rules) and `App.tsx` (`[.light_&]:bg-[#eaf6e9]`).
 */
export const lightPalette: ColorPalette = {
  // Figma design system — exact values from CSS .light
  bg: '#f3f5ef',
  foreground: '#182b22',
  primary: '#168647',
  primaryForeground: '#ffffff',
  secondary: '#e1e9dc',
  accentBlue: '#4ca8ff',
  card: '#ffffff',
  border: '#d6dfd0',
  muted: '#e8eee4',
  mutedForeground: '#586e60',
  surface: '#e8eee4',
  popover: '#e9eee5',
  growing: '#e6c16a',
  destruct: '#e96a6a',

  // Legacy aliases
  surfaceRaised: '#e8eee4',
  text: '#182b22',
  accent: '#168647',
  accentDim: '#d4edd9',
  readyBg: '#eaf6e9',
  danger: '#e96a6a',
  dangerBg: '#fde8e8',
  input: '#ffffff',
  warningBg: '#fdf6e7',
  warningText: '#e6c16a',
};
