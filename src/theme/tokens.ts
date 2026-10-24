/**
 * Static design tokens — spacing, radius, typography, and animation timing.
 * These values do NOT depend on the color scheme and are theme-independent.
 * Imported by components directly, or consumed via src/theme/index.ts.
 */

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
} as const;

export const radius = {
  sm: 8,
  md: 12,  // rounded-xl = 12px
  lg: 16,  // rounded-2xl = 16px
  xl: 24,  // rounded-3xl = 24px
} as const;

// Font families — loaded via expo-font in App.tsx
export const fonts = {
  pixel: 'PixelifySans-Regular',
  pixelBold: 'PixelifySans-Bold',
  pixelSemiBold: 'PixelifySans-SemiBold',
  body: 'DMSans-Regular',
  bodyBold: 'DMSans-Bold',
  bodySemiBold: 'DMSans-SemiBold',
} as const;

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
} as const;
