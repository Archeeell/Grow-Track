export const colors = {
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

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
};

export const radius = {
  sm: 8,
  md: 12,  // rounded-xl = 12px
  lg: 16,  // rounded-2xl = 16px
  xl: 24,  // rounded-3xl = 24px
};

// Font families — loaded via expo-font in App.tsx
export const fonts = {
  pixel: 'PixelifySans-Regular',
  pixelBold: 'PixelifySans-Bold',
  pixelSemiBold: 'PixelifySans-SemiBold',
  body: 'DMSans-Regular',
  bodyBold: 'DMSans-Bold',
  bodySemiBold: 'DMSans-SemiBold',
};

// Splash screen design tokens (Figma Make — exact values)
export const splash = {
  // Container inner (relative, centered children)
  containerWidth: 208,   // w-52 = 52 × 4px
  containerHeight: 128,  // h-32 = 32 × 4px
  // GrowTrackLogo layout
  logoIconSize: 21,      // Sprout icon in GrowTrackLogo
  logoFontSize: 23,      // text-[23px]
  logoGap: 8,            // gap-2 = 2 × 4px
  // Animation icons
  seedSize: 24,          // size-6 = 6 × 4px — pepper-seed.webp
  sproutSize: 28,        // Sprout SVG
  leafSize: 38,          // Leaf SVG
  // Timing (ms)
  totalDuration: 1000,   // all keyframes run 1s
  redirectDelay: 1100,   // setTimeout 1100ms before navigate
  // Easing: CSS 'ease' = cubic-bezier(0.25, 0.1, 0.25, 1.0)
};
